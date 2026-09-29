const DEFAULT_NEXT = "/log";

/**
 * Returns `value` if it is a same-site path, otherwise `/log`.
 * Blocks open redirects such as `//evil.com` and `/\evil.com`
 * (browsers treat a backslash like a slash).
 */
export function safeNext(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return DEFAULT_NEXT;
  }
  return value;
}
