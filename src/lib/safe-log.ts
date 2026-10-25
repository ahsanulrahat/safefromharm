/** Return only non-sensitive error metadata suitable for server logs. */
export function safeErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") return { type: typeof error };

  const candidate = error as { name?: unknown; code?: unknown };
  return {
    type: typeof candidate.name === "string" ? candidate.name : "Error",
    ...(typeof candidate.code === "string" ? { code: candidate.code } : {}),
  };
}
