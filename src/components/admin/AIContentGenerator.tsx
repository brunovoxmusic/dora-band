"use client";

import { useState } from "react";
import { useAIContent } from "@/hooks/useAIContent";
import { PROMPT_TYPES, type PromptType } from "@/lib/ai";
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  SquareArrowOutUpRight,
  AlertCircle,
  X,
  StopCircle,
} from "lucide-react";

/**
 * AIContentGenerator — embeddable AI content generation component for admin.
 *
 * Features:
 * - Prompt type selector (16 content types)
 * - Optional context field (existing content for reference)
 * - Optional instruction field (custom instructions)
 * - Generate button with streaming output
 * - Loading indicator (spinner + "AI píše...")
 * - Streaming output (text appears word-by-word)
 * - Copy to clipboard button
 * - Insert into editor callback
 * - Error state with message
 * - Abort/stop button for ongoing generation
 * - Responsive, dark theme, TailwindCSS only
 *
 * Usage:
 *   <AIContentGenerator onInsert={(text) => setFieldValue(text)} />
 *
 * Or standalone:
 *   <AIContentGenerator />
 */

type Props = {
  /** Called when user clicks "Insert into editor" */
  onInsert?: (text: string) => void;
  /** Default prompt type */
  defaultType?: PromptType;
  /** Optional context text (e.g. current field value) */
  initialContext?: string;
  /** Compact mode (smaller padding) */
  compact?: boolean;
};

export function AIContentGenerator({
  onInsert,
  defaultType = "hero-headline",
  initialContext = "",
  compact = false,
}: Props) {
  const [type, setType] = useState<PromptType>(defaultType);
  const [instruction, setInstruction] = useState("");
  const [context, setContext] = useState(initialContext);
  const [copied, setCopied] = useState(false);

  const { output, isLoading, error, generate, abort, reset } = useAIContent();

  const handleGenerate = () => {
    generate({
      type,
      instruction: instruction.trim() || undefined,
      context: context.trim() || undefined,
    });
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleInsert = () => {
    if (output && onInsert) {
      onInsert(output);
    }
  };

  const handleReset = () => {
    reset();
    setInstruction("");
  };

  const pad = compact ? "p-3" : "p-5";

  return (
    <div className={`border border-charcoal bg-dark-gray ${pad}`}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center bg-neon-red">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-off-white">AI Content Generator</p>
            <p className="font-mono-brand text-[9px] uppercase tracking-wider text-silver">
              Groq · llama-3.3-70b
            </p>
          </div>
        </div>
        {(output || error) && (
          <button
            onClick={handleReset}
            className="text-silver transition-colors hover:text-neon-red"
            aria-label="Reset"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Prompt type selector */}
      <div className="mb-3">
        <label className="mb-1.5 block font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver">
          Typ obsahu
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as PromptType)}
          className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white outline-none transition-colors focus:border-neon-red"
        >
          {PROMPT_TYPES.map((pt) => (
            <option key={pt.value} value={pt.value}>
              {pt.label} — {pt.desc}
            </option>
          ))}
        </select>
      </div>

      {/* Context field */}
      <div className="mb-3">
        <label className="mb-1.5 block font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver">
          Kontext (voliteľné — existujúci obsah)
        </label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={2}
          className="w-full resize-y border border-charcoal bg-ink px-3 py-2 text-sm text-off-white outline-none transition-colors focus:border-neon-red scroll-dora"
          placeholder="Vložte existujúci text pre referenciu..."
        />
      </div>

      {/* Instruction field */}
      <div className="mb-4">
        <label className="mb-1.5 block font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver">
          Inštrukcie (voliteľné)
        </label>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          rows={2}
          className="w-full resize-y border border-charcoal bg-ink px-3 py-2 text-sm text-off-white outline-none transition-colors focus:border-neon-red scroll-dora"
          placeholder="napr. Zameraj sa na letný festival, spomeň Púchov..."
        />
      </div>

      {/* Generate / Stop button */}
      <div className="mb-4 flex gap-2">
        {isLoading ? (
          <button
            onClick={abort}
            className="flex flex-1 items-center justify-center gap-2 border border-neon-red/40 bg-neon-red/10 py-2.5 text-sm font-bold uppercase tracking-wide text-neon-red transition-colors hover:bg-neon-red/20"
          >
            <StopCircle className="h-4 w-4" />
            Stop
          </button>
        ) : (
          <button
            onClick={handleGenerate}
            className="flex flex-1 items-center justify-center gap-2 bg-neon-red py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-deep-red"
          >
            <Sparkles className="h-4 w-4" />
            Vygenerovať
          </button>
        )}
      </div>

      {/* Output area */}
      {(output || isLoading || error) && (
        <div className="border border-charcoal bg-ink p-4">
          {/* Loading indicator */}
          {isLoading && !output && (
            <div className="flex items-center gap-2 py-4 text-silver">
              <Loader2 className="h-4 w-4 animate-spin text-neon-red" />
              <span className="text-xs">AI píše odpoveď...</span>
            </div>
          )}

          {/* Streaming output */}
          {output && (
            <>
              <p className="mb-3 font-mono-brand text-[10px] uppercase tracking-[0.2em] text-warm-yellow">
                {"// Výsledok"}
              </p>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-off-white">
                {output}
                {isLoading && (
                  <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-neon-red align-middle" />
                )}
              </p>

              {/* Action buttons */}
              {!isLoading && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-charcoal pt-3">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 border border-charcoal bg-dark-gray px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-off-white transition-colors hover:border-neon-red hover:text-neon-red"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-400" />
                        Skopírované
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Kopírovať
                      </>
                    )}
                  </button>
                  {onInsert && (
                    <button
                      onClick={handleInsert}
                      className="inline-flex items-center gap-1.5 bg-neon-red px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-deep-red"
                    >
                      <SquareArrowOutUpRight className="h-3.5 w-3.5" />
                      Vložiť do editora
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 py-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-neon-red" />
              <div>
                <p className="text-xs font-semibold text-neon-red">Chyba</p>
                <p className="text-xs text-off-white/70">{error}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
