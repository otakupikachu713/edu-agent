// Thin HTTP client for the local FastAPI backend.
// Backend lives on 127.0.0.1:8765 (see src-tauri/src/lib.rs).

const API_BASE = "http://127.0.0.1:8765";

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

// Returns false on any failure — caller treats "down" and "unreachable" the same.
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

// Streams assistant tokens from POST /chat/stream.
// SSE frames are delimited by "\n\n"; each frame is `data: <payload>`.
// Sentinels match backend/app/routes/chat.py exactly:
//   "[DONE]"      → stream finished
//   "[ERROR] ..." → upstream failure, raised as Error
export async function* chatStream(
  messages: ChatMessage[],
  signal?: AbortSignal,
): AsyncGenerator<string, void, unknown> {
  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!res.ok) {
    // Surface FastAPI's error body verbatim so the UI can show something useful.
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }
  if (!res.body) {
    throw new Error("Response has no body");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Split off complete frames; the trailing partial stays in buffer for next read.
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      if (!frame.startsWith("data: ")) continue;
      const payload = frame.slice("data: ".length);

      if (payload === "[DONE]") return;
      if (payload.startsWith("[ERROR] ")) {
        throw new Error(payload.slice("[ERROR] ".length));
      }
      yield payload;
    }
  }
}
