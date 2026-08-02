"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import useIsPwa from "../../hooks/useIsPwa";

const customerLinks = [
  { href: "/", label: "Home" },
  { href: "/book", label: "Book", auth: true },
  { href: "/trips", label: "Trips", auth: true },
  { href: "/about", label: "About" },
  { href: "/partner", label: "Partners" },
];

const pwaCustomerLinks = [
  { href: "/", label: "Home" },
  { href: "/book", label: "Book" },
  { href: "/trips", label: "Trips" },
  { href: "/account", label: "Account" },
];

const fleetLinks = [
  { href: "/partner/dashboard", label: "Dashboard" },
  { href: "/partner/assign", label: "Assign" },
  { href: "/partner/drivers", label: "Drivers" },
  { href: "/partner/bookings", label: "Bookings" },
  { href: "/partner/payments", label: "Payments" },
  { href: "/partner/settings", label: "Settings" },
];

function getActiveHref(pathname, links) {
  const matches = links.filter((l) => {
    if (l.href === "/") return pathname === "/";
    return pathname === l.href || pathname.startsWith(`${l.href}/`);
  });
  if (matches.length === 0) return null;
  return matches.sort((a, b) => b.href.length - a.href.length)[0].href;
}

export default function HomeNavbar() {
  const { data: session, status } = useSession();
  const isPwa = useIsPwa();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredHref, setHoveredHref] = useState(null);
  const menuRef = useRef(null);
  const isLoading = status === "loading";
  const isFleet = session?.user?.role === "fleet";

  useEffect(() => {
    const onOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const links = isFleet
    ? fleetLinks
    : isPwa
      ? pwaCustomerLinks
      : customerLinks.filter((l) => !l.auth || session);
  const activeHref = getActiveHref(pathname, links);
  const indicatorHref = hoveredHref ?? activeHref;
  const ctaHref = isFleet
    ? "/partner/bookings"
    : session
      ? "/book"
      : "/signup";
  const ctaLabel = isFleet
    ? "View bookings"
    : session
      ? "Book a chauffeur"
      : "Sign up";
  const accountHref = isFleet ? "/partner/dashboard" : "/account";
  const accountLabel = isFleet
    ? session?.user?.name || "Partner"
    : session?.user?.name || "Account";

  return (
    <header
      ref={menuRef}
      className="relative z-50 w-full bg-void px-5 py-4 md:px-8"
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between">
        <Link
          href={isFleet ? "/partner/dashboard" : "/"}
          className="flex items-center gap-2.5 font-instrument text-[32px] font-normal tracking-[-0.02em] text-paper"
        >
          Chauff
          <span className="rounded-[3px] border border-black bg-white px-1.5 py-0.5 font-body text-[11px] font-medium leading-none text-black">
            Beta
          </span>
        </Link>

        <nav
          className="relative hidden items-center gap-8 md:flex"
          onMouseLeave={() => setHoveredHref(null)}
        >
          {links.map((l) => {
            const isActive = activeHref === l.href;
            const showDot = indicatorHref === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                onMouseEnter={() => setHoveredHref(l.href)}
                className={`relative pb-1.5 font-body text-[14px] transition-colors ${
                  isActive || hoveredHref === l.href
                    ? "text-paper"
                    : "text-frost hover:text-paper"
                }`}
              >
                {l.label}
                {showDot && (
                  <motion.span
                    layoutId="nav-dot"
                    className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-paper"
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 35,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="h-8 w-24 animate-pulse rounded-full bg-white/10" />
          ) : (
            <>
              {session ? (
                <>
                  {!isPwa && (
                    <Link
                      href={accountHref}
                      className="hidden font-body text-[14px] text-frost transition-colors hover:text-paper sm:inline"
                    >
                      {accountLabel}
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="hidden font-body text-[14px] text-frost transition-colors hover:text-paper sm:inline"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                !isPwa && (
                  <Link
                    href="/signin"
                    className="hidden font-body text-[14px] text-frost transition-colors hover:text-paper sm:inline"
                  >
                    Sign in
                  </Link>
                )
              )}
              {/* PWA: signed-out CTAs live on the hero; signed-in keeps Book */}
              {(!isPwa || session) && (
                <Link
                  href={ctaHref}
                  className="inline-flex items-center justify-center rounded-full bg-paper px-4 py-2 font-body text-[13px] text-black transition-opacity hover:opacity-85"
                >
                  {ctaLabel}
                </Link>
              )}
            </>
          )}

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center md:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-paper"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d={
                  menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="mt-3 flex flex-col border-t border-white/10 pt-3 md:hidden">
          {links.map((l) => {
            const isActive = activeHref === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-1 py-2.5 font-body text-[15px] ${
                  isActive ? "text-paper" : "text-frost"
                }`}
              >
                {l.label}
                {isActive && (
                  <span className="h-1 w-1 rounded-full bg-paper" />
                )}
              </Link>
            );
          })}
          {!session && (
            <>
              <Link
                href="/signin"
                onClick={() => setMenuOpen(false)}
                className={`px-1 py-2.5 font-body text-[15px] text-frost ${
                  isPwa ? "" : "sm:hidden"
                }`}
              >
                Sign in
              </Link>
              {isPwa && (
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="px-1 py-2.5 font-body text-[15px] text-frost"
                >
                  Sign up
                </Link>
              )}
            </>
          )}
          {session && (
            <>
              {!isPwa && (
                <Link
                  href={accountHref}
                  onClick={() => setMenuOpen(false)}
                  className="px-1 py-2.5 font-body text-[15px] text-frost sm:hidden"
                >
                  {accountLabel}
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="px-1 py-2.5 text-left font-body text-[15px] text-frost"
              >
                Sign out
              </button>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
