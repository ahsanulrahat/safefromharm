export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const inputClass =
  "w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-base text-ink shadow-sm placeholder:text-muted/70 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200";

export const labelClass = "block text-sm font-semibold text-brand-900";

export const hintClass = "mt-1 text-xs text-muted";

export const errorClass = "mt-1 text-sm font-medium text-red-700";

export function buttonClass(
  variant: "primary" | "secondary" | "ghost" | "danger" | "gold" = "primary"
) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
  switch (variant) {
    case "secondary":
      return `${base} border border-brand-300 bg-white text-brand-800 hover:bg-brand-50`;
    case "ghost":
      return `${base} text-brand-800 hover:bg-brand-50`;
    case "danger":
      return `${base} border border-red-300 bg-white text-red-700 hover:bg-red-50`;
    case "gold":
      return `${base} bg-gold-400 text-brand-950 hover:bg-gold-300`;
    default:
      return `${base} bg-brand-700 text-white shadow-sm hover:bg-brand-800`;
  }
}

export const cardClass =
  "rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6";
