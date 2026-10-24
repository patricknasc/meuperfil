"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { IconAlert, IconInfo } from "@/components/app-icons";
import { ModalScrollLock } from "@/components/modal-scroll-lock";
import { useFlowTranslation } from "@/lib/i18n/use-flow-translation";

/**
 * In-app replacements for window.confirm and window.alert, styled like the
 * rest of the app and translated. Use through useDialogs() inside the
 * dashboard (DashboardShell renders the provider).
 */

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  /** "danger" for destructive actions (delete, disconnect). */
  tone?: "danger" | "default";
}

interface AlertOptions {
  title: string;
  message?: string;
}

interface DialogState {
  kind: "confirm" | "alert";
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
}

interface DialogsApi {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
}

const DialogsContext = createContext<DialogsApi | null>(null);

export function useDialogs(): DialogsApi {
  const api = useContext(DialogsContext);
  if (!api) throw new Error("useDialogs must be used inside <DialogsProvider>");
  return api;
}

export function DialogsProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setDialog({ kind: "confirm", options, resolve })),
    []
  );
  const alert = useCallback(
    (options: AlertOptions) =>
      new Promise<void>((resolve) => setDialog({ kind: "alert", options, resolve: () => resolve() })),
    []
  );

  function close(result: boolean) {
    dialog?.resolve(result);
    setDialog(null);
  }

  return (
    <DialogsContext.Provider value={{ confirm, alert }}>
      {children}
      {dialog && <DialogView dialog={dialog} onClose={close} />}
    </DialogsContext.Provider>
  );
}

function DialogView({ dialog, onClose }: { dialog: DialogState; onClose: (result: boolean) => void }) {
  const t = useFlowTranslation();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const { options, kind } = dialog;
  const danger = options.tone === "danger";

  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm animate-fade-in" onClick={() => onClose(false)}>
      <ModalScrollLock />
      <div
        role={kind === "confirm" ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-[0_24px_60px_-24px_rgba(22,18,15,.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex gap-4">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${danger ? "bg-error/10 text-error" : "bg-accent/10 text-accent"}`}>
            {danger ? <IconAlert /> : <IconInfo />}
          </span>
          <div className="min-w-0 pt-1">
            <h2 id="app-dialog-title" className="font-heading text-lg font-semibold tracking-tight">
              {options.title}
            </h2>
            {options.message && <p className="mt-1.5 text-sm leading-6 text-muted">{options.message}</p>}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          {kind === "confirm" && (
            <button
              type="button"
              onClick={() => onClose(false)}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-hover"
            >
              {t("Cancel")}
            </button>
          )}
          <button
            ref={confirmRef}
            type="button"
            onClick={() => onClose(true)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${
              danger ? "bg-error hover:bg-error/90" : "bg-accent hover:bg-accent-hover"
            }`}
          >
            {kind === "alert" ? t("OK") : options.confirmLabel ?? t("Confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
