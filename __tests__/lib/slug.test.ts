import { createSlug } from "@/lib/slug";

describe("slug helper", () => {
  it("normalizes names into URL-friendly slugs", () => {
    expect(createSlug("  Acme Health Group  ")).toBe("acme-health-group");
  });

  it("collapses punctuation and duplicate separators", () => {
    expect(createSlug("North__Star+++Labs")).toBe("north-star-labs");
  });

  it("returns an empty string when no letters or numbers remain", () => {
    expect(createSlug("!!!")).toBe("");
  });
});
