export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const inputClass =
  "w-full min-h-[44px] rounded-xl border border-brand-200 bg-white px-4 py-3 text-base text-ink shadow-sm transition-all duration-200 placeholder:text-muted/60 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200/80 hover:border-brand-300 dark:border-brand-800/80 dark:bg-brand-950/60 dark:text-brand-50 dark:placeholder:text-brand-400/60 dark:focus:border-brand-400 dark:focus:ring-brand-400/20";

export const labelClass = "block text-sm font-semibold text-brand-950 dark:text-brand-100 mb-1.5";

export const hintClass = "mt-1 text-xs text-muted dark:text-brand-300";

export const errorClass = "mt-1.5 text-sm font-semibold text-red-700 dark:text-red-400";

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
      ? "px-3.5 py-2 text-xs min-h-[36px]"
      : size === "lg"
        ? "px-6 py-3.5 text-base min-h-[48px]"
        : "px-5 py-2.5 text-sm min-h-[44px]";
  const base =
    `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98] ${sizeClass}`;
  switch (variant) {
    case "secondary":
      return `${base} border border-brand-700 bg-white text-brand-700 shadow-sm hover:bg-brand-50 hover:shadow-md dark:border-brand-600 dark:bg-brand-900/40 dark:text-brand-200 dark:hover:bg-brand-900/80`;
    case "ghost":
    case "link":
      return `${base} text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/50`;
    case "accent":
      return `${base} bg-accent-500 text-white shadow-sm hover:bg-accent-600 hover:shadow-md dark:bg-accent-600 dark:hover:bg-accent-500`;
    case "danger":
    case "destructive":
      return `${base} border border-accent-500 bg-white text-accent-600 hover:bg-accent-50 dark:border-accent-600 dark:bg-accent-950/40 dark:text-accent-300`;
    case "gold":
      return `${base} bg-gold-400 text-brand-950 shadow-sm hover:bg-gold-300 hover:shadow-md dark:bg-gold-500 dark:text-brand-950`;
    default:
      return `${base} bg-brand-700 text-white shadow-sm hover:bg-brand-800 hover:shadow-md dark:bg-brand-600 dark:hover:bg-brand-500`;
  }
}

export const cardClass =
  "rounded-2xl border border-brand-100 bg-white p-5 shadow-sm hover-lift sm:p-6 dark:border-brand-900/80 dark:bg-brand-950/50 dark:shadow-none";
