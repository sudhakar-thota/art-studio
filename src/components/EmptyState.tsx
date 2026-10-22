import React from "react";
import { FolderOpen } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  actionText,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="bg-white border border-stone-200 border-dashed rounded-xl p-10 text-center max-w-lg mx-auto my-6 shadow-sm">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-stone-100 text-stone-500 mb-4">
        {icon || <FolderOpen className="w-6 h-6 text-stone-400" />}
      </div>
      <h3 className="text-base font-semibold text-stone-800 mb-1">{title}</h3>
      <p className="text-sm text-stone-500 mb-6">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center px-4 py-2 border border-stone-300 rounded-lg text-sm font-medium text-stone-700 bg-white hover:bg-stone-50 transition-colors shadow-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
