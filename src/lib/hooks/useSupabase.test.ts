import { describe, it, expect, vi } from "vitest";

vi.mock("../supabase/client", () => {
  return {
    supabaseClient: { from: vi.fn(), auth: { getUser: vi.fn() } },
  };
});

import { useSupabase } from "./useSupabase";

describe("useSupabase hook", () => {
  it("zwraca singleton supabaseClient", async () => {
    const { supabase } = useSupabase();
    expect(supabase).toBeDefined();
    expect(typeof supabase).toBe("object");
    expect("from" in supabase).toBe(true);
  });
});
