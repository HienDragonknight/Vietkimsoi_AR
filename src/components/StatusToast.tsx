"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, type LucideIcon } from "lucide-react";
import type { ToastMessage } from "@/types";

interface StatusToastProps {
  toast: ToastMessage | null;
  action?: { label: string; onClick: () => void };
}

const ICONS: Record<ToastMessage["variant"], LucideIcon> = {
  info: Info,
  error: AlertTriangle,
  success: CheckCircle2,
};

/** Floating glass toast, anchored to the top safe-area, for camera/AR status messages. */
export function StatusToast({ toast, action }: StatusToastProps) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: -16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.96 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="pointer-events-auto absolute left-1/2 top-[max(1.25rem,env(safe-area-inset-top))] z-50 flex w-[min(92vw,26rem)] -translate-x-1/2 items-start gap-3 rounded-2xl border border-white/15 bg-black/60 px-4 py-3.5 text-white shadow-glass-lg backdrop-blur-xl"
        >
          <ToastIcon variant={toast.variant} />
          <div className="flex-1">
            <p className="text-[13.5px] leading-snug text-white/90">{toast.message}</p>
            {action && (
              <button
                type="button"
                onClick={action.onClick}
                className="mt-2 text-[13px] font-medium text-white underline underline-offset-2 transition-opacity hover:opacity-75"
              >
                {action.label}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ToastIcon({ variant }: { variant: ToastMessage["variant"] }) {
  const Icon = ICONS[variant];
  return <Icon size={19} className="mt-0.5 shrink-0" />;
}
