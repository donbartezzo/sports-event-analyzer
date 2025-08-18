import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSupabase } from "@/lib/hooks/useSupabase";
import type { User } from "@supabase/supabase-js";

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(6, "Password must be at least 6 characters"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

interface Props {
  initialUser: User;
}

export function PasswordChangeForm(_: Props) {
  void _; // mark unused prop as intentionally ignored
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { supabase } = useSupabase();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
  });

  const onSubmit = async (data: PasswordChangeFormData) => {
    try {
      setIsLoading(true);
      setStatus("idle");
      setErrorMessage("");

      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) throw error;

      setStatus("success");
      reset(); // Clear form
    } catch (err) {
      console.error("Error changing password:", err);
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <Input id="currentPassword" type="password" {...register("currentPassword")} disabled={isLoading} />
        {errors.currentPassword && (
          <p className="text-sm font-medium text-destructive">{errors.currentPassword.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="newPassword">New Password</Label>
        <Input id="newPassword" type="password" {...register("newPassword")} disabled={isLoading} />
        {errors.newPassword && <p className="text-sm font-medium text-destructive">{errors.newPassword.message}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input id="confirmPassword" type="password" {...register("confirmPassword")} disabled={isLoading} />
        {errors.confirmPassword && (
          <p className="text-sm font-medium text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      {status === "error" && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      {status === "success" && (
        <Alert>
          <AlertDescription>Password changed successfully</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Changing password..." : "Change password"}
      </Button>
    </form>
  );
}
