"use client";

import { useState, useCallback, useRef } from "react";
import type { PromptType } from "@/lib/ai";

/**
 * useAIContent — hook for admin AI content generation.
 *
 * Communicates ONLY with /api/admin/ai (server-side).
 * The browser never sees GROQ_API_KEY.
 *
 * Features:
 * - Streaming response (text accumulates as AI generates)
 * - Loading / error states
 * - Abort (cancel) ongoing generation
 * - No external dependencies beyond fetch
 *
 * Usage:
 *   const { generate, output, isLoading, error, abort, reset } = useAIContent();
 *   generate({ type: "seo-title", instruction: "..." });
 */

type GenerateParams = {
  type: PromptType;
  instruction?: string;
  context?: string;
};

export function useAIContent() {
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (params: GenerateParams) => {
    // Reset state
    setOutput("");
    setError(null);
    setIsLoading(true);

    // Create abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/admin/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Neznáma chyba" }));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      // Read streaming response
      const reader = res.body?.getReader();
      if (!reader) throw new Error("Stream nie je dostupný.");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // Parse AI SDK data stream protocol
        // Format: "0:text\n" where 0 is the data type
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const text = JSON.parse(line.slice(2));
              accumulated += text;
              setOutput(accumulated);
            } catch {
              // Not valid JSON, skip
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // User cancelled — don't show error
      } else {
        const message = err instanceof Error ? err.message : "Neznáma chyba";
        setError(message);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const reset = useCallback(() => {
    setOutput("");
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    output,
    isLoading,
    error,
    generate,
    abort,
    reset,
  };
}
