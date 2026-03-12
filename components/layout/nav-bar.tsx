"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/collections", label: "Collections" },
  { href: "/reports", label: "Reports" },
];

function navLinkClass(pathname: string, href: string) {
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return cn(
    "px-3 py-1.5 rounded-md text-sm transition-colors",
    isActive
      ? "text-foreground bg-muted"
      : "text-muted-foreground hover:text-foreground hover:bg-muted"
  );
}

interface Props {
  userName: string;
}

export function NavBar({ userName }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop nav */}
      <div className="flex items-center justify-between w-full">
        <nav className="hidden sm:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className={navLinkClass(pathname, href)}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden sm:flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{userName}</span>
          <form action={logout}>
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="mr-1 h-4 w-4" />
              Logout
            </Button>
          </form>
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div
          role="navigation"
          className="sm:hidden border-t border-border px-4 py-3 space-y-1"
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(navLinkClass(pathname, href), "block")}
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="border-t border-border pt-3 mt-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{userName}</span>
            <form action={logout}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="mr-1 h-4 w-4" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
