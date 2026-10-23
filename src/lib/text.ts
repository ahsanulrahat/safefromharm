/** Client-safe text helpers (no Node imports). */
export function countWords(text: string) {
  return text.trim().split(/\s+/u).filter(Boolean).length;
}
