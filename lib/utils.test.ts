import { describe, expect, it } from "vitest";
import { stripHtml } from "./utils";

describe("stripHtml", () => {
  it('decodes &nbsp; to space', () => {
    expect(stripHtml("Kopi&nbsp;Arabica")).toBe("Kopi Arabica");
  });

  it("decodes &amp;", () => {
    expect(stripHtml("A &amp; B")).toBe("A & B");
  });

  it("decodes &lt; and &gt;", () => {
    expect(stripHtml("&lt;b&gt;text&lt;/b&gt;")).toBe("text");
  });

  it("decodes &quot;", () => {
    expect(stripHtml('&quot;hello&quot;')).toBe('"hello"');
  });

  it("decodes &#39;", () => {
    expect(stripHtml("it&#39;s")).toBe("it's");
  });

  it("strips HTML tags while decoding entities", () => {
    expect(stripHtml("<p>&nbsp;Kopi&nbsp;Arabica&nbsp;</p>")).toBe(" Kopi Arabica ");
  });

  it("handles empty string", () => {
    expect(stripHtml("")).toBe("");
  });

  it("returns original text when no tags or entities", () => {
    expect(stripHtml("Plain text")).toBe("Plain text");
  });

  it("handles multiple consecutive entities", () => {
    expect(stripHtml("&nbsp;&nbsp;&nbsp;")).toBe("   ");
  });
});
