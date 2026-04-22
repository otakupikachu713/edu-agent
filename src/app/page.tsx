"use client";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [msg, setMsg] = useState("");

  async function testPing() {
    try {
      const res = await invoke<string>("ping");
      setMsg(res);
    } catch (e) {
      setMsg(`Error: ${e}`);
    }
  }

  async function openChat() {
    try {
      await invoke("toggle_floating");
    } catch (e) {
      setMsg(`Error: ${e}`);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-slate-900">📚 EduAgent</h1>
        <p className="mt-2 text-slate-600">
          A local-first AI learning assistant
        </p>

        <div className="mt-8 flex gap-3">
          <Button onClick={testPing}>Test Tauri IPC</Button>
          <Button variant="outline" onClick={openChat}>
            Toggle Chat Window
          </Button>
        </div>

        {msg && (
          <div className="mt-4 rounded-md border bg-white p-4 text-sm">
            {msg}
          </div>
        )}

        <div className="mt-12 grid grid-cols-2 gap-4">
          <div className="rounded-lg border bg-white p-6">
            <h3 className="font-semibold">📄 My Documents</h3>
            <p className="mt-1 text-sm text-slate-500">
              Coming soon (Day 3-4)
            </p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <h3 className="font-semibold">⚙️ Settings</h3>
            <p className="mt-1 text-sm text-slate-500">Coming soon (Day 5)</p>
          </div>
        </div>
      </div>
    </main>
  );
}