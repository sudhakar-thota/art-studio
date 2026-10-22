import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

export type AlertType = "success" | "error" | "warning" | "info";

interface AlertBannerProps {
  type: AlertType;
  message: string;
  details?: string;
  onDismiss?: () => void;
}

export function AlertBanner({ type, message, details, onDismiss }: AlertBannerProps) {
  const configs = {
    success: {
      bg: "bg-emerald-50 border-emerald-200 text-emerald-900",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
    },
    error: {
      bg: "bg-rose-50 border-rose-200 text-rose-900",
      icon: <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
    },
    warning: {
      bg: "bg-amber-50 border-amber-200 text-amber-900",
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
    },
    info: {
      bg: "bg-blue-50 border-blue-200 text-blue-900",
      icon: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />,
    },
  };

  const { bg, icon } = configs[type] || configs.info;

  return (
    <div
      className={`border rounded-lg p-4 flex items-start justify-between gap-3 shadow-sm transition-all my-3 ${bg}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {icon}
        <div>
          <p className="text-sm font-semibold leading-5">{message}</p>
          {details && <p className="text-xs mt-1 opacity-90">{details}</p>}
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-stone-400 hover:text-stone-700 transition-colors p-1"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
