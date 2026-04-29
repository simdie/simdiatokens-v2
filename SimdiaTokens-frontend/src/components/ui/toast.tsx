"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "warning";

interface Toast {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (title: string, message?: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToastContext must be used within ToastProvider");
  return ctx;
}

const icons: Record<ToastVariant, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
};

const styles: Record<ToastVariant, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  error: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const addToast = useCallback(
    (title: string, message?: string, variant: ToastVariant = "success") => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, title, message, variant }]);
      const timer = setTimeout(() => removeToast(id), 4000);
      timers.current.set(id, timer);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = icons[toast.variant];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 80, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 80, scale: 0.95 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={cn(
                  "pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl min-w-[300px] max-w-[420px]",
                  "bg-[#12121a]/95",
                  styles[toast.variant]
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{toast.title}</p>
                  {toast.message && (
                    <p className="text-[10px] opacity-80 mt-0.5">{toast.message}</p>
                  )}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
