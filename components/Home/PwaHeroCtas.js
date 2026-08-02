"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

/**
 * PWA hero actions: Sign in / Sign up, or Book a chauffeur when signed in.
 */
export default function PwaHeroCtas({ className = "" }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div
        className={`flex w-full justify-center ${className}`}
        aria-hidden="true"
      >
        <div className="h-[52px] w-[200px] animate-pulse rounded-full bg-white/15" />
      </div>
    );
  }

  if (session) {
    return (
      <div className={`flex w-full justify-center ${className}`}>
        <Link
          href="/book"
          className="inline-flex h-[52px] min-w-[200px] items-center justify-center rounded-full bg-paper px-8 font-body text-[15px] font-medium text-void transition-opacity hover:opacity-90 md:h-[56px] md:text-[16px]"
        >
          Book a chauffeur
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center ${className}`}
    >
      <Link
        href="/signin"
        className="inline-flex h-[52px] items-center justify-center rounded-full border border-white/35 bg-white/10 px-8 font-body text-[15px] font-medium text-paper backdrop-blur-md transition-colors hover:border-white/55 hover:bg-white/15 md:h-[56px] md:text-[16px]"
      >
        Sign in
      </Link>
      <Link
        href="/signup"
        className="inline-flex h-[52px] items-center justify-center rounded-full bg-paper px-8 font-body text-[15px] font-medium text-void transition-opacity hover:opacity-90 md:h-[56px] md:text-[16px]"
      >
        Sign up
      </Link>
    </div>
  );
}
