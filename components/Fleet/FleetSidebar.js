"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  House,
  MapPinned,
  Users,
  Calendar,
  CreditCard,
  Settings,
  PanelLeftClose,
  ChevronUp,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { useFleetTheme } from "./FleetThemeContext";

const navItems = [
  {
    href: "/partner/dashboard",
    label: "Overview",
    icon: House,
  },
  {
    href: "/partner/assign",
    label: "Assign",
    icon: MapPinned,
  },
  {
    href: "/partner/drivers",
    label: "Drivers",
    icon: Users,
  },
  {
    href: "/partner/bookings",
    label: "Bookings",
    icon: Calendar,
  },
  {
    href: "/partner/payments",
    label: "Payments",
    icon: CreditCard,
  },
  {
    href: "/partner/settings",
    label: "Settings",
    icon: Settings,
  },
];

export default function FleetSidebar({ collapsed, onToggle }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggleTheme } = useFleetTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const name = session?.user?.name || "Partner";
  const initial = name.trim().charAt(0).toUpperCase() || "P";
  const isLight = theme === "light";

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <aside
      className={`sticky top-0 z-40 flex h-screen shrink-0 flex-col border-r border-fleet-border bg-fleet-sidebar transition-[width] duration-200 ease-out ${
        collapsed ? "w-[68px]" : "w-[240px]"
      }`}
    >
      <div
        className={`flex h-14 items-center border-b border-fleet-border ${
          collapsed ? "justify-center px-2" : "justify-between px-4"
        }`}
      >
        {!collapsed && (
          <Link
            href="/partner/dashboard"
            className="inline-flex items-center gap-2.5"
          >
            <Image
              src="/logo.png"
              alt="Chauff"
              width={879}
              height={1236}
              className="fleet-logo h-8 w-auto"
            />
          </Link>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ash transition-colors hover:bg-fleet-hover hover:text-paper"
        >
          <PanelLeftClose
            size={18}
            strokeWidth={1.75}
            className={collapsed ? "rotate-180" : ""}
            aria-hidden="true"
          />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <p
          className={`mb-2 px-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ash ${
            collapsed ? "sr-only" : ""
          }`}
        >
          Partner
        </p>
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center rounded-lg transition-colors ${
                    collapsed
                      ? "justify-center px-0 py-2.5"
                      : "gap-3 px-3 py-2.5"
                  } ${
                    active
                      ? "bg-graphite text-paper"
                      : "text-frost hover:bg-fleet-hover hover:text-paper"
                  }`}
                >
                  <Icon
                    size={18}
                    strokeWidth={1.75}
                    className={`shrink-0 ${active ? "text-paper" : "text-ash"}`}
                    aria-hidden="true"
                  />
                  {!collapsed && (
                    <span className="font-body text-[14px]">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="relative border-t border-fleet-border p-2">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className={`flex w-full items-center rounded-lg transition-colors hover:bg-fleet-hover ${
            collapsed ? "justify-center p-2" : "gap-3 px-2 py-2"
          }`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper font-body text-[13px] font-medium text-fleet-on-paper">
            {initial}
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1 truncate text-left font-body text-[14px] text-paper">
                {name}
              </span>
              <ChevronUp
                size={14}
                strokeWidth={2}
                className={`shrink-0 text-ash transition-transform ${
                  menuOpen ? "" : "rotate-180"
                }`}
                aria-hidden="true"
              />
            </>
          )}
        </button>

        {menuOpen && (
          <div
            className={`absolute bottom-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-fleet-border bg-obsidian shadow-xl ${
              collapsed ? "left-2 w-44" : "left-2 right-2"
            }`}
          >
            <button
              type="button"
              onClick={toggleTheme}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left font-body text-[14px] text-frost transition-colors hover:bg-fleet-hover hover:text-paper"
            >
              {isLight ? (
                <Moon size={15} strokeWidth={1.75} className="text-ash" aria-hidden="true" />
              ) : (
                <Sun size={15} strokeWidth={1.75} className="text-ash" aria-hidden="true" />
              )}
              {isLight ? "Dark mode" : "Light mode"}
            </button>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-2 border-t border-fleet-border px-3 py-2.5 text-left font-body text-[14px] text-frost transition-colors hover:bg-fleet-hover hover:text-paper"
            >
              <LogOut
                size={15}
                strokeWidth={1.75}
                className="text-ash"
                aria-hidden="true"
              />
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
