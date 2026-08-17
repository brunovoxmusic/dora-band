"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const QUICK_PROMPTS = [
  "Čo máme dnes spraviť?",
  "Ktoré dopyty potrebujú odpoveď?",
  "Aké koncerty máme naplánované?",
  "Pomôž s návrhom follow-up emailu",
];

/**
 * M4.3 — D.O.R.A. AI Copilot
 *
 * Kontextový AI asistent v adminu. Floating button v pravom dolnom rohu.
 * Otvára sa na klik alebo klávesovou skratkou.
 * Používa reálne DB dáta cez /api/admin/copilot endpoint.
 */
export function AiCopilot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });

      if (!res.ok) throw new Error("Zlyhalo");

      // Read streaming response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      // Add empty assistant message that we'll fill
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          assistantContent += decoder.decode(value, { stream: true });
          // Update last assistant message
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: assistantContent };
            return updated;
          });
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Prepáč, nepodarilo sa mi odpovedať. Skús to znova." }]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Keyboard shortcut: Ctrl+Shift+A (or Cmd+Shift+A)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "a") {
        e.preventDefault();
        setOpen(v => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-neon-red bg-ink/90 text-neon-red shadow-lg backdrop-blur-md transition-all hover:bg-neon-red hover:text-white hover:scale-110"
          aria-label="Otvoriť D.O.R.A. AI Copilot"
          title="D.O.R.A. AI Copilot (Ctrl+Shift+A)"
        >
          <Sparkles className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-red/60" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-neon-red" />
          </span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md sm:right-4 sm:left-auto sm:w-96">
          <div className="flex h-[500px] max-h-[80vh] flex-col border border-charcoal bg-ink/98 shadow-2xl backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-charcoal px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neon-red/20 text-neon-red">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-off-white">D.O.R.A. AI</p>
                  <p className="font-mono-brand text-[8px] uppercase tracking-wider text-silver/60">
                    Copilot · kontextový asistent
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-silver hover:text-neon-red"
                aria-label="Zavrieť"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto scroll-dora p-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neon-red/10 text-neon-red">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-off-white">Ahoj! Som D.O.R.A. AI</p>
                  <p className="mt-1 max-w-xs text-xs text-silver/70">
                    Mám prístup k tvojím dátam — dopyty, koncerty, úlohy, booking. Spýtaj sa ma čokoľvek.
                  </p>
                  <div className="mt-4 space-y-1.5">
                    {QUICK_PROMPTS.map(prompt => (
                      <button
                        key={prompt}
                        onClick={() => send(prompt)}
                        className="block w-full border border-charcoal bg-dark-gray px-3 py-2 text-left text-xs text-off-white/80 transition-colors hover:border-neon-red hover:text-neon-red"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-2",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neon-red/20 text-neon-red">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] px-3 py-2 text-sm",
                      msg.role === "user"
                        ? "bg-neon-red text-white"
                        : "border border-charcoal bg-dark-gray text-off-white/90"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {loading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neon-red/20 text-neon-red">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div className="border border-charcoal bg-dark-gray px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-neon-red" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-charcoal p-3">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  placeholder="Spýtaj sa..."
                  className="flex-1 border border-charcoal bg-dark-gray px-3 py-2 text-sm text-off-white outline-none focus:border-neon-red"
                  disabled={loading}
                />
                <button
                  onClick={() => send(input)}
                  disabled={loading || !input.trim()}
                  className="inline-flex h-9 w-9 items-center justify-center bg-neon-red text-white disabled:opacity-50"
                  aria-label="Odoslať"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1.5 font-mono-brand text-[8px] uppercase tracking-wider text-silver/30">
                AI používa reálne dáta z DB · {messages.length} správ
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
