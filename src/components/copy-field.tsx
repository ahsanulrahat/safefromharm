"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui";

export function CopyField({
  value,
  label,
  copiedLabel,
  mono = false,
}: {
  value: string;
  label: string;
  copiedLabel: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <code
        className={
          "min-w-0 flex-1 break-all rounded-xl border border-brand-200/90 bg-white px-3.5 py-2.5 text-sm font-semibold text-brand-950 shadow-2xs " +
          (mono ? "font-mono" : "")
        }
      >
        {value}
      </code>
      <button
        type="button"
        onClick={copy}
        className={
          (copied
            ? "inline-flex items-center justify-center gap-1.5 rounded-xl border border-brand-300 bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand-800 shadow-2xs"
            : buttonClass("secondary")) + " shrink-0 transition-all duration-200"
        }
        aria-live="polite"
      >
        {copied ? (
          <>
            <span className="text-brand-700">✓</span> {copiedLabel}
          </>
        ) : (
          label
        )}
      </button>
    </div>
  );
}
