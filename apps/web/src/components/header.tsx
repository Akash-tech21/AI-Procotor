"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

const links = [
  { to: "/", label: "Home" },
  { to: "/interview", label: "Interview" },
  { to: "/admin", label: "Admin" },
] as const;

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border/50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-display text-sm font-semibold tracking-tight"
          >
            Proctor
          </Link>
          <nav className="flex gap-6">
            {links.map(({ to, label }) => {
              const isActive =
                to === "/" ? pathname === "/" : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  href={to}
                  className={`text-[13px] transition-colors duration-150 ${
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
