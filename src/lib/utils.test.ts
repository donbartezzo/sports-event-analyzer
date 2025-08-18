import { describe, it, expect, vi } from "vitest";
import { cn, formatDate } from "./utils";

describe("cn", () => {
  it("scala klasy i usuwa duplikaty tailwind", () => {
    expect(cn("p-2", "p-4", { hidden: false, block: true })).toBe("p-4 block");
  });
});

describe("formatDate", () => {
  it("formatuje datę w en-US z godziną i minutą", () => {
    const fixed = new Date("2024-12-24T15:07:00.000Z");
    vi.setSystemTime(fixed);
    // funkcja używa toLocaleDateString z opcjami, zależne od strefy - sprawdzimy stabilne fragmenty
    const out = formatDate("2024-12-24T15:07:00.000Z");
    expect(out).toMatch(/Dec/);
    expect(out).toMatch(/24/);
    expect(out).toMatch(/2024/);
    // dopasuj dowolną godzinę z minutami 07 i opcjonalnym AM/PM (12/24h)
    expect(out).toMatch(/\b\d{1,2}:07(?:\s?(AM|PM))?\b/);
    vi.useRealTimers();
  });
});
