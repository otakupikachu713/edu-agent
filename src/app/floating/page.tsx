"use client";

import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { X, Minus } from "lucide-react";
import { chatStream, type ChatMessage } from "@/lib/api";

export default function FloatingPage() {
  const dragRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const el = dragRef.current;
    if (!el) return;
    const onMouseDown = async (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
      try {
        await getCurrentWindow().startDragging();
      } catch (err) {
        console.error(err);
      }
    };
    el.addEventListener("mousedown", onMouseDown);
    return () => el.removeEventListener("mousedown", onMouseDown);
  }, []);

  // Pin scroll to bottom on every message tick — user msg, then every streamed token.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const hide = () => getCurrentWindow().hide();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    // Snapshot what we send — must not include the empty assistant bubble.
    const history = [...messages, userMsg];

    setInput("");
    setError(null);
    setSending(true);
    setMessages([...history, { role: "assistant", content: "" }]);

    try {
      for await (const chunk of chatStream(history)) {
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = { ...last, content: last.content + chunk };
          return copy;
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      // Drop the empty/partial assistant bubble so retry doesn't leave a stranded turn.
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur">
      <div
        ref={dragRef}
        className="flex h-10 items-center justify-between border-b bg-slate-50/80 px-3 select-none"
      >
        <span className="text-sm font-medium text-slate-700">EduAgent</span>
        <div className="flex gap-1" data-no-drag>
          <button onClick={hide} className="rounded p-1 hover:bg-slate-200" aria-label="Minimize">
            <Minus className="h-4 w-4" />
          </button>
          <button onClick={hide} className="rounded p-1 hover:bg-red-100 hover:text-red-600" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3" data-no-drag>
        {messages.length === 0 && !error && (
          <div className="mt-8 text-center text-sm text-slate-400">Ask me anything.</div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-auto max-w-[85%] rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"
                : "mr-auto max-w-[85%] whitespace-pre-wrap rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800"
            }
          >
            {m.content || (m.role === "assistant" && sending ? "..." : "")}
          </div>
        ))}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t p-3" data-no-drag>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
            placeholder={sending ? "Thinking..." : "Type a message..."}
            className="flex-1 rounded-lg border bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
