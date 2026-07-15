/**
 * Sanitize a string by trimming whitespace and removing HTML tags.
 * Prevents XSS by stripping any HTML tag patterns from input.
 */
export function sanitize(value: string): string {
  return value.trim().replace(/<[^>]*>/g, "");
}
