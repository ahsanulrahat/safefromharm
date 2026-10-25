export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const inputClass =
  "w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-base text-ink shadow-sm placeholder:text-muted/70 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200";

export const labelClass = "block text-sm font-semibold text-brand-900";

export const hintClass = "mt-1 text-xs text-muted";

export const errorClass = "mt-1 text-sm font-medium text-red-700";

export function buttonClass(
  variant:
    | "primary"
    | "secondary"
    | "ghost"
    | "link"
    | "accent"
    | "danger"
    | "destructive"
    | "gold" = "primary",
  size: "sm" | "md" | "lg" = "md"
) {
  const sizeClass =
    size === "sm"
      ? "px-3 py-2 text-xs min-h-[36px]"
      : size === "lg"
        ? "px-5 py-3 text-base min-h-[48px]"
        : "px-4 py-2.5 text-sm min-h-[44px]";
  const base =
    `inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${sizeClass}`;
  switch (variant) {
    case "secondary":
      return `${base} border border-brand-700 bg-white text-brand-700 hover:bg-brand-50`;
    case "ghost":
    case "link":
      return `${base} text-brand-700 hover:bg-brand-50`;
    case "accent":
      return `${base} bg-accent-500 text-white shadow-sm hover:bg-accent-600`;
    case "danger":
    case "destructive":
      return `${base} border border-accent-500 bg-white text-accent-600 hover:bg-accent-50`;
    case "gold":
      return `${base} bg-gold-400 text-brand-950 hover:bg-gold-300`;
    default:
      return `${base} bg-brand-700 text-white shadow-sm hover:bg-brand-800`;
  }
}

export const cardClass =
  "rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6";
