import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { newPasswordSchema, type NewPasswordFormData } from '../../lib/validations/auth';

export default function NewPasswordForm() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordSchema),
  });

  const password = watch('password');

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit(() => {})}>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="password">Nowe hasło</Label>
            <Input
              id="password"
              type="password"
              placeholder="********"
              disabled={isLoading}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm font-medium text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="********"
              disabled={isLoading}
              {...register('confirmPassword', {
                validate: (value) =>
                  value === password || 'Hasła muszą być identyczne',
              })}
            />
            {errors.confirmPassword && (
              <p className="text-sm font-medium text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
          {status === 'error' && (
            <Alert variant="destructive">
              <AlertDescription>Nie udało się zmienić hasła</AlertDescription>
            </Alert>
          )}
          {status === 'success' && (
            <Alert>
              <AlertDescription>
                Hasło zostało zmienione. Możesz się teraz zalogować.
              </AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Zapisywanie...' : 'Zapisz nowe hasło'}
          </Button>
        </div>
      </form>
    </div>
  );
}
