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
          initial={{ opacity: 0, y: -12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.97 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="pointer-events-auto absolute inset-x-[max(0.625rem,env(safe-area-inset-left))] top-[calc(max(0.5rem,env(safe-area-inset-top))+3.25rem)] z-40 flex max-w-none items-start gap-2 rounded-xl border border-white/15 bg-black/65 px-3 py-2.5 text-white shadow-glass-lg backdrop-blur-xl sm:inset-x-auto sm:left-1/2 sm:top-[max(1.25rem,env(safe-area-inset-top))] sm:w-[min(94vw,26rem)] sm:-translate-x-1/2 sm:gap-2.5 sm:rounded-2xl sm:px-4 sm:py-3.5"
        >
          <ToastIcon variant={toast.variant} />
          <div className="min-w-0 flex-1">
            <ToastCopy toast={toast} />
            {action && (
              <button
                type="button"
                onClick={action.onClick}
                className="mt-1.5 text-[12px] font-medium text-white underline underline-offset-2 transition-opacity hover:opacity-75 sm:mt-2 sm:text-[13px]"
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

function ToastCopy({ toast }: { toast: ToastMessage }) {
  const mobileText = toast.messageMobile ?? toast.message;
  const sharedClass =
    "text-[11px] leading-[1.35] text-white/90 [overflow-wrap:anywhere] sm:text-[13.5px] sm:leading-snug";

  if (toast.messageMobile && toast.messageMobile !== toast.message) {
    return (
      <>
        <p className={`${sharedClass} sm:hidden`}>{mobileText}</p>
        <p className={`${sharedClass} hidden sm:block`}>{toast.message}</p>
      </>
    );
  }

  return <p className={sharedClass}>{toast.message}</p>;
}

function ToastIcon({ variant }: { variant: ToastMessage["variant"] }) {
  const Icon = ICONS[variant];
  return (
    <Icon
      className="mt-0.5 h-4 w-4 shrink-0 sm:h-[19px] sm:w-[19px]"
      aria-hidden
    />
  );
}
