export function formatDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  }).format(date);
}

export function formatDateTime(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dhaka",
  }).format(date);
}

export function formatPercent(value: number, locale: string = "en") {
  return new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-GB", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}
