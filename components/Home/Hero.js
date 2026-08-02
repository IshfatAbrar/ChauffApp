"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import AppStoreButtons from "./AppStoreButtons";
import WaitlistPill from "./WaitlistPill";

const ease = [0.22, 1, 0.36, 1];

/** Section 1 — inset rounded hero under white navbar */
export default function Hero() {
  return (
    <section className="relative flex w-full flex-col bg-void px-3 pb-3 md:px-4 md:pb-4">
      {/* Fully rounded image panel — inset on black */}
      <div className="relative flex h-[calc(100svh-5.5rem)] min-h-[420px] flex-col items-center overflow-hidden rounded-[24px] md:h-[calc(100svh-6rem)] md:rounded-[32px]">
        <div className="pointer-events-none absolute inset-0">
          <Image
            src="/hero.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        {/* Soft read overlay for white headline */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.45) 100%)",
          }}
        />

        {/* Headline — centered in the panel */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
          <motion.h1
            className="max-w-[14ch] text-center font-instrument text-[82px] font-normal leading-[1.08] tracking-[-0.02em] text-paper md:text-[128px] md:leading-[1.05]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease }}
          >
            Not a ride.
            <br />A chauffeur.
          </motion.h1>
        </div>

        {/* Bottom stack in flow — subtitle above badges so they never overlap */}
        <div className="relative z-10 mt-auto flex w-full flex-col gap-4 px-4 pb-4 sm:gap-5 sm:px-7 sm:pb-6 md:pb-8">
          <div className="flex flex-col items-center gap-2 sm:gap-3">
            <motion.p
              className="max-w-[28ch] text-center font-mono text-[10px] uppercase tracking-[0.18em] text-frost sm:max-w-none md:text-[11px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.35, ease }}
            >
              Career chauffeurs for airport, corporate, and private travel.
            </motion.p>

            <motion.a
              href="#invite"
              aria-label="Scroll to next section"
              className="hidden cursor-pointer text-frost sm:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, y: [0, 6, 0] }}
              transition={{
                opacity: { duration: 0.6, delay: 0.6 },
                y: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
              }}
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("invite")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.a>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease }}
            className="flex w-full flex-col items-stretch gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6"
          >
            <AppStoreButtons variant="hero" />
            <WaitlistPill className="lg:ml-auto lg:max-w-[380px]" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
