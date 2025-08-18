import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { newPasswordSchema, type NewPasswordFormData } from "../../lib/validations/auth";

export default function NewPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordSchema),
  });

  const password = watch("password");

  const onSubmit = async (data: NewPasswordFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/auth/new-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: data.password }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error);
      }

      // Redirect will be handled by the endpoint
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while changing the password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          <div className="grid gap-1">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              disabled={isLoading}
              {...register("password")}
            />
            {errors.password && <p className="text-sm font-medium text-destructive">{errors.password.message}</p>}
          </div>
          <div className="grid gap-1">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              disabled={isLoading}
              {...register("confirmPassword", {
                validate: (value) => value === password || "Passwords must match",
              })}
            />
            {errors.confirmPassword && (
              <p className="text-sm font-medium text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Updating password..." : "Update password"}
          </Button>
        </div>
      </form>
    </div>
  );
}
