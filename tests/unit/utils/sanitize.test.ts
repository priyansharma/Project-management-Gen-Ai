import { describe, it, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { sanitize } from "@/lib/utils";

describe("sanitize", () => {
  it("trims leading and trailing whitespace", () => {
    expect(sanitize("  hello  ")).toBe("hello");
  });

  it("removes HTML tags", () => {
    expect(sanitize("<script>alert('xss')</script>")).toBe("alert('xss')");
  });

  it("removes HTML tags and trims whitespace", () => {
    expect(sanitize("  <b>bold</b> text  ")).toBe("bold text");
  });

  it("handles empty string", () => {
    expect(sanitize("")).toBe("");
  });

  it("handles string with only whitespace", () => {
    expect(sanitize("   ")).toBe("");
  });

  it("handles string with no HTML or extra whitespace", () => {
    expect(sanitize("hello world")).toBe("hello world");
  });

  it("removes self-closing tags", () => {
    expect(sanitize("line<br/>break")).toBe("linebreak");
  });

  it("removes nested tags", () => {
    expect(sanitize("<div><span>content</span></div>")).toBe("content");
  });
});

// Feature: project-tracker, Property 17: Input sanitization
// **Validates: Requirements 13.3**
test.prop([fc.string()], { numRuns: 100 })(
  "sanitized string has no HTML tags or surrounding whitespace",
  (input) => {
    const result = sanitize(input);
    expect(result).toBe(result.trim());
    expect(result).not.toMatch(/<[^>]*>/);
  }
);
