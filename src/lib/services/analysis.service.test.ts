import { describe, it, expect } from "vitest";
import { AnalysisService } from "./analysis.service";
import { ValidationError } from "../errors/validation.error";
import { DatabaseError } from "../errors/database.error";

function supabaseMockForCreate({ typeExists = true, insertError = null }: { typeExists?: boolean; insertError?: any }) {
  // minimalny łańcuch wywołań używany w createAnalysis
  const tables: Record<string, any> = {};

  const analysis_types = {
    select: (_cols: string) => analysis_types,
    eq: (_col: string, _val: unknown) => analysis_types,
    single: () => ({ data: typeExists ? { id: 1 } : null, error: typeExists ? null : { message: "not found" } }),
  };
  tables["analysis_types"] = analysis_types;

  const analysis = {
    insert: (_payload: unknown) => analysis,
    select: () => analysis,
    single: () => ({ data: insertError ? null : ({ id: 123 } as any), error: insertError }),
  };
  tables["analysis"] = analysis;

  return {
    from: (name: string) => tables[name],
  } as any;
}

describe("AnalysisService.createAnalysis", () => {
  it("rzuca ValidationError, gdy command.user_id != userId", async () => {
    const supabase = supabaseMockForCreate({});
    const svc = new AnalysisService(supabase);

    const command = {
      user_id: "user-A",
      analysis_type_id: 1,
      parameters: { x: 1 },
    } as any;

    await expect(svc.createAnalysis(command, "user-B")).rejects.toBeInstanceOf(ValidationError);
  });

  function supabaseMockForList({
    data = [],
    count = 0,
    error = null as any,
  }: {
    data?: any[];
    count?: number;
    error?: any;
  }) {
    const chain: any = {
      select: (_cols: string, _opts?: any) => chain,
      eq: (_col: string, _val: unknown) => chain,
      order: (_col: string, _opts?: any) => chain,
      range: async (_from: number, _to: number) => ({ data, error, count }),
    };
    return {
      from: (name: string) => (name === "analysis" ? chain : undefined),
    } as any;
  }

  describe("AnalysisService.getAnalyses", () => {
    it("zwraca dane paginacji i listę analiz (bez filtra typu)", async () => {
      const supabase = supabaseMockForList({ data: [{ id: 1 }, { id: 2 }], count: 2 });
      const svc = new AnalysisService(supabase);
      const res = await svc.getAnalyses("user-1", { page: 1, limit: 10 });
      expect(res.total).toBe(2);
      expect(res.page).toBe(1);
      expect(res.limit).toBe(10);
      expect(res.data).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it("rzuca DatabaseError gdy zapytanie zwróci błąd", async () => {
      const supabase = supabaseMockForList({ error: { message: "db down" } });
      const svc = new AnalysisService(supabase);
      await expect(svc.getAnalyses("user-1", { page: 2, limit: 5 })).rejects.toBeInstanceOf(DatabaseError);
    });
  });

  function supabaseMockForGet(updateOk = true, delOk = true) {
    const getSingle = {
      select: (_: string) => getSingle,
      eq: (_c: string, _v: unknown) => getSingle,
      single: async () => ({ data: { id: 10, user_id: "user-1" }, error: null }),
    };

    const updateChain = {
      update: (_payload: any) => updateChain,
      eq: (_: string, __: unknown) => updateChain,
      select: () => updateChain,
      single: async () => ({
        data: updateOk ? { id: 10, analysis_type_id: 7 } : null,
        error: updateOk ? null : { message: "fail" },
      }),
    };

    const deleteChain = {
      delete: () => deleteChain,
      eq: (_: string, __: unknown) => deleteChain,
      then: undefined as any, // not awaited directly, service awaits result of from().delete().eq().eq()
    } as any;
    deleteChain.then = async (resolve: any) => resolve({ error: delOk ? null : { message: "fail" } });

    return {
      from: (name: string) => {
        if (name === "analysis") {
          return {
            // getAnalysis path
            select: getSingle.select,
            eq: getSingle.eq,
            single: getSingle.single,
            // update path
            update: updateChain.update,
            // delete path
            delete: deleteChain.delete,
          } as any;
        }
        return undefined as any;
      },
    } as any;
  }

  describe("AnalysisService.updateAnalysis", () => {
    it("aktualizuje rekord i zwraca zaktualizowaną analizę", async () => {
      const supabase = supabaseMockForGet(true, true);
      const svc = new AnalysisService(supabase);
      const out = await svc.updateAnalysis(10, { analysis_type_id: 7, parameters: { a: 1 } } as any, "user-1");
      expect(out).toEqual({ id: 10, analysis_type_id: 7 });
    });

    it("rzuca DatabaseError, gdy update się nie powiedzie", async () => {
      const supabase = supabaseMockForGet(false, true);
      const svc = new AnalysisService(supabase);
      await expect(
        svc.updateAnalysis(10, { analysis_type_id: 7, parameters: {} } as any, "user-1")
      ).rejects.toBeInstanceOf(DatabaseError);
    });
  });

  describe("AnalysisService.deleteAnalysis", () => {
    it("usuwa analizę po wcześniejszej weryfikacji właściciela", async () => {
      const supabase = supabaseMockForGet(true, true);
      const svc = new AnalysisService(supabase);
      await expect(svc.deleteAnalysis(10, "user-1")).resolves.toBeUndefined();
    });

    it("rzuca DatabaseError gdy delete zwróci błąd", async () => {
      const supabase = supabaseMockForGet(true, false);
      const svc = new AnalysisService(supabase);
      await expect(svc.deleteAnalysis(10, "user-1")).rejects.toBeInstanceOf(DatabaseError);
    });
  });

  it("tworzy analysis, gdy typ istnieje i userId zgodny", async () => {
    const supabase = supabaseMockForCreate({ typeExists: true, insertError: null });
    const svc = new AnalysisService(supabase);

    const command = {
      user_id: "user-1",
      analysis_type_id: 1,
      parameters: { foo: "bar" },
    } as any;

    const result = await svc.createAnalysis(command, "user-1");
    expect(result).toEqual({ id: 123 });
  });

  it("rzuca ValidationError, gdy typ analizy nie istnieje", async () => {
    const supabase = supabaseMockForCreate({ typeExists: false });
    const svc = new AnalysisService(supabase);

    const command = {
      user_id: "user-1",
      analysis_type_id: 999,
      parameters: {},
    } as any;

    await expect(svc.createAnalysis(command, "user-1")).rejects.toBeInstanceOf(ValidationError);
  });
});
