import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";

const items = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Analyses",
    href: "/analyses/list",
  },
  {
    title: "Events",
    href: "/events/list",
  },
  {
    title: "Profile",
    href: "/user/profile",
  },
];

export function MainNav() {
  const [path, setPath] = useState("");

  useEffect(() => {
    setPath(window.location.pathname);
  }, []);

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            path === item.href ? "text-primary" : "text-muted-foreground"
          )}
        >
          {item.title}
        </a>
      ))}
    </nav>
  );
}
