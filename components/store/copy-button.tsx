"use client";

import { useState } from "react";

export function CopyButton({ value, label, copiedLabel, className }: { value: string; label: string; copiedLabel: string; className: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt(label, value);
        }
      }}
      className={className}
    >
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </button>
  );
}
