"use client";

/**
 * useChat hook is now inline in AIChat.tsx using @ai-sdk/react directly.
 * This file is kept for backward compatibility but re-exports from AIChat.
 *
 * In AI SDK v7, useChat has a different API (sendMessage, parts, status).
 * The old useChat hook wrapper is no longer needed.
 */

export { useChat } from "@ai-sdk/react";
