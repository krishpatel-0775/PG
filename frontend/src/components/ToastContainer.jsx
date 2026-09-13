"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Receipt,
  Clock,
  AlertCircle,
  Sparkles,
  ExternalLink,
  X,
} from "lucide-react";

/**
 * Toast item component displaying a single real-time alert card with animated countdown
 */
function ToastItem({ toast, onDismiss, onAction }) {
  const [active, setActive] = useState(false);
  const toastId = toast.toastId || toast.id;

  useEffect(() => {
    // Trigger smooth CSS progress transition
    const animFrame = requestAnimationFrame(() => setActive(true));

    // Auto-dismiss safely in a timer callback outside of React render phase
    const timer = setTimeout(() => {
      onDismiss(toastId);
    }, 6000);

    return () => {
      cancelAnimationFrame(animFrame);
      clearTimeout(timer);
    };
  }, [toastId, onDismiss]);

  const getCategoryConfig = (type) => {
    switch (type) {
      case "PAYMENT_RECEIPT":
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
          chipClass: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
          borderAccent: "border-l-4 border-l-emerald-500",
          barColor: "bg-emerald-500",
          label: "Payment Received",
        };
      case "INVOICE_GENERATED":
        return {
          icon: <Receipt className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
          chipClass: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
          borderAccent: "border-l-4 border-l-indigo-500",
          barColor: "bg-indigo-500",
          label: "New Invoice",
        };
      case "RENT_DUE_REMINDER":
        return {
          icon: <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
          chipClass: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
          borderAccent: "border-l-4 border-l-amber-500",
          barColor: "bg-amber-500",
          label: "Rent Reminder",
        };
      case "RENT_OVERDUE":
        return {
          icon: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
          chipClass: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
          borderAccent: "border-l-4 border-l-rose-500",
          barColor: "bg-rose-500",
          label: "Overdue Notice",
        };
      case "WELCOME":
      default:
        return {
          icon: <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
          chipClass: "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
          borderAccent: "border-l-4 border-l-purple-500",
          barColor: "bg-purple-500",
          label: "Announcement",
        };
    }
  };

  const config = getCategoryConfig(toast.type);

  return (
    <div
      role="alert"
      className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl border border-slate-200/80 dark:border-slate-800 ${config.borderAccent} transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in`}
    >
      <div className="p-4">
        {/* Top bar: Category chip + Live indicator + Close button */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${config.chipClass} tracking-wide`}
            >
              {config.label}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          </div>

          <button
            type="button"
            onClick={() => onDismiss(toast.toastId || toast.id)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Dismiss Alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 shrink-0 border border-slate-100 dark:border-slate-700/60">
            {config.icon}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {toast.title}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5 leading-relaxed">
              {toast.message}
            </p>

            {toast.actionUrl && (
              <button
                type="button"
                onClick={() => onAction(toast)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mt-2 transition-colors cursor-pointer"
              >
                <span>View Details</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Auto-dismiss progress timer */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 overflow-hidden">
        <div
          className={`h-full ${config.barColor} transition-all duration-[6000ms] ease-linear`}
          style={{ width: active ? "0%" : "100%" }}
        />
      </div>
    </div>
  );
}

/**
 * Floating toast container positioned at bottom-right corner of screen
 */
export default function ToastContainer({ toasts = [], onDismiss, onAction }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-3 sm:px-0"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.toastId || toast.id}
          toast={toast}
          onDismiss={onDismiss}
          onAction={onAction}
        />
      ))}
    </div>
  );
}
