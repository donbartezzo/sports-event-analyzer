import { describe, it, expect, vi, beforeEach } from "vitest";

// mock astro:middleware BEFORE importing SUT
vi.mock("astro:middleware", () => ({
  defineMiddleware: (fn: any) => fn,
}));

// mock createSupabaseServer BEFORE importing SUT
vi.mock("../lib/supabase/server", () => ({
  createSupabaseServer: vi.fn(() => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
    },
  })),
}));

// import SUT after mocks
const { onRequest } = await import("./index");

function makeCtx(overrides: Partial<any> = {}) {
  const locals: any = {};
  const cookies = {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  } as any;
  const request = new Request("http://localhost/", { headers: new Headers() });
  const url = new URL("http://localhost/");
  const redirect = (to: string) => ({ redirectedTo: to });
  const next = vi.fn(() => ({ ok: true }));
  return {
    args: { locals, cookies, url, request, redirect },
    next,
    locals,
    url,
    ...overrides,
  };
}

describe("middleware/onRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("przepuszcza publiczne ścieżki (np. /login) i ustawia locals.supabase", async () => {
    const { args, next, locals } = makeCtx();
    (args as any).url = new URL("http://localhost/login");

    const res = await onRequest(args as any, next as any);
    expect(next).toHaveBeenCalled();
    expect(res).toEqual({ ok: true });
    expect(locals.supabase).toBeDefined();
  });

  it("redirectuje na /login gdy brak usera dla protected ścieżki", async () => {
    const { args, next } = makeCtx();
    (args as any).url = new URL("http://localhost/dashboard");

    const res = await onRequest(args as any, next as any);
    expect(next).not.toHaveBeenCalled();
    expect(res).toEqual({ redirectedTo: "/login" });
  });

  it("wywołuje next gdy user jest zalogowany", async () => {
    // podmieniamy zachowanie mocka supabase.auth.getUser
    const mod = await import("../lib/supabase/server");
    (mod.createSupabaseServer as any).mockReturnValue({
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: "u1" } }, error: null })),
      },
    });

    const { args, next, locals } = makeCtx();
    (args as any).url = new URL("http://localhost/dashboard");

    const res = await onRequest(args as any, next as any);
    expect(next).toHaveBeenCalled();
    expect(res).toEqual({ ok: true });
    expect(locals.user).toEqual({ id: "u1" });
  });
});
