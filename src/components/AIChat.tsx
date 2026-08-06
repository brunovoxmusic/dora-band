"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Loader2, Trash2, Bot, User, AlertCircle, X } from "lucide-react";

/**
 * AIChat — embeddable AI chat component (AI SDK v7 compatible).
 *
 * Uses useChat from @ai-sdk/react with DefaultChatTransport.
 * Streaming responses, loading, error, clear conversation.
 * Responsive, dark theme, TailwindCSS only.
 */
export function AIChat() {
  const [input, setInput] = useState("");

  const chat = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat.messages]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    chat.sendMessage({ text: input });
    setInput("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  const isLoading = chat.status === "streaming" || chat.status === "submitted";

  return (
    <div className="flex h-[500px] flex-col border border-charcoal bg-dark-gray">
      <div className="flex items-center justify-between border-b border-charcoal px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center bg-neon-red">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-off-white">AI Asistent</p>
            <p className="font-mono-brand text-[9px] uppercase tracking-wider text-silver">
              D.O.R.A. Assistant
            </p>
          </div>
        </div>
        {chat.messages.length > 0 && (
          <button
            onClick={() => chat.setMessages([])}
            className="inline-flex h-8 w-8 items-center justify-center text-silver transition-colors hover:text-neon-red"
            aria-label="Vymazať"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-dora p-4">
        {chat.messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Bot className="h-12 w-12 text-silver/30" />
            <p className="mt-3 text-sm text-silver">Spýtajte sa ma na čokoľvek o kapele D.O.R.A.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {chat.messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center ${message.role === "user" ? "bg-warm-yellow" : "bg-neon-red"}`}>
                  {message.role === "user" ? <User className="h-4 w-4 text-ink" /> : <Bot className="h-4 w-4 text-white" />}
                </div>
                <div className={`max-w-[80%] px-3 py-2 text-sm ${message.role === "user" ? "bg-warm-yellow/10 text-off-white" : "bg-ink text-off-white"}`}>
                  <p className="whitespace-pre-wrap break-words">
                    {message.parts?.map((part, i) => part.type === "text" ? <span key={i}>{part.text}</span> : null)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 py-2 text-silver">
            <Loader2 className="h-4 w-4 animate-spin text-neon-red" />
            <span className="text-xs">AI píše odpoveď...</span>
          </div>
        )}

        {chat.error && (
          <div className="mt-4 flex items-start gap-2 border border-neon-red/40 bg-neon-red/5 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-neon-red" />
            <div>
              <p className="text-xs font-semibold text-neon-red">Chyba</p>
              <p className="text-xs text-off-white/70">{String(chat.error)}</p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="border-t border-charcoal p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Napíšte správu..."
            rows={1}
            className="max-h-32 min-h-[40px] flex-1 resize-none border border-charcoal bg-ink px-3 py-2 text-sm text-off-white outline-none focus:border-neon-red scroll-dora"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="inline-flex h-10 w-10 items-center justify-center bg-neon-red text-white transition-colors hover:bg-deep-red disabled:opacity-30"
            aria-label="Odoslať"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 font-mono-brand text-[9px] uppercase tracking-wider text-silver/40">
          Enter = odoslať · Shift+Enter = nový riadok
        </p>
      </form>
    </div>
  );
}
