"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import InstallAppButton from "./InstallAppButton";

const columns = [
  {
    links: [
      { href: "/book", label: "Book" },
      { href: "/trips", label: "Trips" },
      { href: "/partner", label: "Partners" },
    ],
  },
  {
    links: [
      { href: "/about", label: "About" },
      { href: "/safety", label: "Safety" },
      { href: "/payments", label: "Payments" },
      { href: "/contact", label: "Contact" },
      { href: "/signup", label: "Sign up" },
      { href: "/signin", label: "Sign in" },
    ],
  },
  {
    links: [
      { href: "https://linkedin.com", label: "LinkedIn", external: true },
      { href: "https://twitter.com", label: "X", external: true },
      { href: "https://instagram.com", label: "Instagram", external: true },
      { href: "https://facebook.com", label: "Facebook", external: true },
    ],
  },
];

const linkClass =
  "font-body text-[14px] text-ash transition-colors duration-200 hover:text-paper md:text-[15px]";

function Footer() {
  const currPath = usePathname();
  const isBook =
    currPath === "/book" ||
    currPath === "/signin" ||
    currPath === "/signup" ||
    currPath === "/account" ||
    currPath === "/payment" ||
    (currPath &&
      currPath.startsWith("/partner/") &&
      currPath !== "/partner/signup") ||
    (currPath &&
      currPath.startsWith("/fleet/") &&
      currPath !== "/fleet/signup");

  if (isBook) return null;

  return (
    <footer className="hide-in-pwa bg-void px-6 pb-atlas-32 pt-atlas-64 md:px-10 md:pb-atlas-48 md:pt-atlas-88">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col">
        <div className="flex flex-col justify-between gap-12 md:flex-row md:items-start md:gap-16">
          <div className="max-w-[280px] shrink-0">
            <Link href="/" aria-label="Chauff home" className="inline-flex">
              <Image
                src="/logo.png"
                alt="Chauff"
                width={879}
                height={1236}
                className="h-12 w-auto brightness-0 invert md:h-14"
              />
            </Link>
            <p className="mt-5 font-body text-[14px] leading-[1.55] text-ash md:text-[15px]">
              Career chauffeurs for airport, corporate, and private travel.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-12 gap-y-8 sm:gap-x-16 md:gap-x-20 lg:gap-x-24">
            {columns.map((col, i) => (
              <nav key={i} className="flex min-w-[7rem] flex-col gap-3.5">
                {col.links.map((l) =>
                  l.external ? (
                    <a
                      key={l.label}
                      href={l.href}
                      className={linkClass}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link key={l.label} href={l.href} className={linkClass}>
                      {l.label}
                    </Link>
                  )
                )}
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-atlas-64 flex flex-col gap-4 border-t border-white/10 pt-atlas-24 sm:flex-row sm:items-center sm:justify-between md:mt-atlas-88">
          <p className="font-body text-[13px] text-ash md:text-[14px]">
            © {new Date().getFullYear()} Chauff Inc. All rights reserved.
          </p>
          <InstallAppButton />
        </div>
      </div>
    </footer>
  );
}

export default Footer;
