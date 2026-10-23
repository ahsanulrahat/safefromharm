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
          "min-w-0 flex-1 break-all rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-950 " +
          (mono ? "font-mono" : "")
        }
      >
        {value}
      </code>
      <button
        type="button"
        onClick={copy}
        className={buttonClass("secondary") + " shrink-0"}
        aria-live="polite"
      >
        {copied ? copiedLabel : label}
      </button>
    </div>
  );
}
