"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { buttonClass, inputClass, labelClass } from "@/components/ui";

export function VerifyForm({
  label,
  placeholder,
  submit,
}: {
  label: string;
  placeholder: string;
  submit: string;
}) {
  const [value, setValue] = useState("");
  const router = useRouter();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const id = value.trim().toUpperCase();
        if (id) router.push(`/verify/${encodeURIComponent(id)}`);
      }}
      className="mt-6 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm"
    >
      <label className={labelClass} htmlFor="certificate-id">
        {label}
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id="certificate-id"
          name="certificateId"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          autoCapitalize="characters"
          spellCheck={false}
          className={inputClass + " font-mono uppercase"}
          required
        />
        <button type="submit" className={buttonClass("primary") + " shrink-0"}>
          {submit}
        </button>
      </div>
    </form>
  );
}
