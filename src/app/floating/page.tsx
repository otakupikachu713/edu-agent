"use client";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useRef } from "react";
import { X, Minus } from "lucide-react";

export default function FloatingPage() {
  const dragRef = useRef<HTMLDivElement>(null);

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

  const hide = () => getCurrentWindow().hide();

  return (
    <div className="flex h-screen flex-col overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur">
      <div
        ref={dragRef}
        className="flex h-10 items-center justify-between border-b bg-slate-50/80 px-3 select-none"
      >
        <span className="text-sm font-medium text-slate-700">
          💬 EduAgent
        </span>
        <div className="flex gap-1" data-no-drag>
          <button
            onClick={hide}
            className="rounded p-1 hover:bg-slate-200"
            aria-label="Minimize"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={hide}
            className="rounded p-1 hover:bg-red-100 hover:text-red-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 text-sm text-slate-500">
        Chat area (Day 9)
      </div>

      <div className="border-t p-3">
        <div className="rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-400">
          Type or hold to talk... (Day 9 / Day 13)
        </div>
      </div>
    </div>
  );
}