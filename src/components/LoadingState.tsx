import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  variant?: "inline" | "card" | "full";
}

export function LoadingState({ message = "Loading studio collection...", variant = "card" }: LoadingStateProps) {
  if (variant === "inline") {
    return (
      <div className="flex items-center gap-2 text-stone-500 py-3 text-sm">
        <Loader2 className="w-4 h-4 animate-spin text-terracotta" />
        <span>{message}</span>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className="bg-white/80 border border-stone-200 rounded-xl p-12 text-center shadow-sm">
        <div className="inline-flex items-center justify-center p-3 bg-amber-50 rounded-full mb-3">
          <Loader2 className="w-6 h-6 animate-spin text-terracotta" />
        </div>
        <p className="text-stone-700 font-medium">{message}</p>
        <p className="text-xs text-stone-400 mt-1">Communicating with studio vault...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[300px] flex flex-col items-center justify-center p-8 text-center">
      <Loader2 className="w-8 h-8 animate-spin text-terracotta mb-4" />
      <p className="text-stone-700 font-medium">{message}</p>
    </div>
  );
}
