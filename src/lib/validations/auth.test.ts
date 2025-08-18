import { describe, it, expect } from "vitest";
import { loginSchema, newPasswordSchema, resetPasswordSchema } from "./auth";

describe("validations/auth", () => {
  it("odrzuca niepoprawny email i krótkie hasło w loginSchema", () => {
    const r1 = loginSchema.safeParse({ email: "not-email", password: "123" });
    expect(r1.success).toBe(false);
    if (!r1.success) {
      const msgs = r1.error.issues.map((i) => i.message);
      expect(msgs).toContain("Nieprawidłowy adres email");
      expect(msgs).toContain("Hasło musi mieć co najmniej 8 znaków");
    }
  });

  it("akceptuje poprawne dane w resetPasswordSchema", () => {
    const r = resetPasswordSchema.safeParse({ email: "user@example.com" });
    expect(r.success).toBe(true);
  });

  it("odrzuca różne hasła w newPasswordSchema", () => {
    const r = newPasswordSchema.safeParse({ password: "verysecret", confirmPassword: "different" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const confirmIssue = r.error.issues.find((i) => i.path.join(".") === "confirmPassword");
      expect(confirmIssue?.message).toBe("Hasła muszą być identyczne");
    }
  });
});
