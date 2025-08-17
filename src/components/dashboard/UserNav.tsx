import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Button } from "../../components/ui/button";
import { useSupabase } from "../../lib/hooks/useSupabase";
import type { User } from "@supabase/supabase-js";

interface Props {
  initialUser: User;
}

export function UserNav({ initialUser }: Props) {
  const [user, setUser] = useState<User | null>(initialUser);
  const { supabase } = useSupabase();

  // Efekt nasłuchujący na zmiany stanu użytkownika
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
      } else if (session?.user) {
        setUser(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Efekt obsługujący przekierowanie po wylogowaniu
  useEffect(() => {
    if (user === null) {
      window.location.href = "/login";
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      setUser(null); // Natychmiast czyścimy stan użytkownika

      // Wywołujemy endpoint wylogowania, który wyczyści sesję po stronie serwera
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Błąd podczas wylogowywania");
      }

      // Przekierowanie zostanie obsłużone przez endpoint
    } catch (error) {
      console.error("Błąd wylogowania:", error);
      window.location.href = "/login";
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
            {user.email?.[0]?.toUpperCase()}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Account</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/user/profile">Profile</a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/user/settings">Settings</a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
