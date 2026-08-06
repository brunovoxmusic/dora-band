"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { Send, Loader2, Trash2, Bot, User, AlertCircle } from "lucide-react";

/**
 * AIChat — embeddable AI chat component.
 *
 * Features:
 * - Streaming responses (text appears word-by-word)
 * - Textarea input with Enter-to-send (Shift+Enter for newline)
 * - Loading indicator while AI is thinking
 * - Error state with retry
 * - Clear conversation button
 * - Responsive (mobile + desktop)
 * - Dark theme matching D.O.R.A. brand
 *
 * Usage: <AIChat />
 *
 * No external UI library — pure TailwindCSS.
 */
export function AIChat() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop,
    clearChat,
  } = useChat();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Show/hide scroll-to-bottom button
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 200);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
      }
    }
  };

  return (
    <div className="flex h-[500px] flex-col border border-charcoal bg-dark-gray">
      {/* Header */}
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
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="inline-flex h-8 w-8 items-center justify-center text-silver transition-colors hover:text-neon-red"
            aria-label="Vymazať konverzáciu"
            title="Vymazať konverzáciu"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto scroll-dora p-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Bot className="h-12 w-12 text-silver/30" />
            <p className="mt-3 text-sm text-silver">
              Spýtajte sa ma na čokoľvek o kapele D.O.R.A.
            </p>
            <p className="mt-1 text-xs text-silver/50">
              Booking, koncerty, hudba, história...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center ${
                    message.role === "user"
                      ? "bg-warm-yellow"
                      : "bg-neon-red"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="h-4 w-4 text-ink" />
                  ) : (
                    <Bot className="h-4 w-4 text-white" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-sm px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "bg-warm-yellow/10 text-off-white"
                      : "bg-ink text-off-white"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 py-2 text-silver">
            <Loader2 className="h-4 w-4 animate-spin text-neon-red" />
            <span className="text-xs">AI píše odpoveď...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-start gap-2 border border-neon-red/40 bg-neon-red/5 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-neon-red" />
            <div>
              <p className="text-xs font-semibold text-neon-red">Chyba</p>
              <p className="text-xs text-off-white/70">{error.message}</p>
            </div>
          </div>
        )}

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 border border-charcoal bg-ink px-3 py-1.5 text-xs text-silver transition-colors hover:text-neon-red"
          >
            ↓ Dolu
          </button>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-charcoal p-3"
      >
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={onKeyDown}
            placeholder="Napíšte správu..."
            rows={1}
            className="max-h-32 min-h-[40px] flex-1 resize-none border border-charcoal bg-ink px-3 py-2 text-sm text-off-white outline-none transition-colors focus:border-neon-red scroll-dora"
            disabled={isLoading}
          />
          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="inline-flex h-10 items-center gap-1.5 border border-charcoal px-3 text-xs font-bold uppercase text-silver transition-colors hover:border-neon-red hover:text-neon-red"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="inline-flex h-10 w-10 items-center justify-center bg-neon-red text-white transition-colors hover:bg-deep-red disabled:opacity-30"
              aria-label="Odoslať"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-1.5 font-mono-brand text-[9px] uppercase tracking-wider text-silver/40">
          Enter = odoslať · Shift+Enter = nový riadok
        </p>
      </form>
    </div>
  );
}
