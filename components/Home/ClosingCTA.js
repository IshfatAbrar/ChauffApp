"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease },
  }),
};

/** Final homepage section — closing invite before footer */
export default function ClosingCTA({
  title,
  description,
  primaryHref,
  primaryLabel,
  footnote,
}) {
  const { data: session } = useSession();

  const resolvedHref =
    primaryHref ?? (session ? "/book" : "/signup");
  const resolvedLabel =
    primaryLabel ?? (session ? "Book a chauffeur" : "Sign up");
  const resolvedTitle = title ?? (
    <>
      Ready for a
      <br />
      real chauffeur?
    </>
  );
  const resolvedDescription =
    description ??
    "Join Chauff and travel with professionals who dedicate their craft to private journeys—airport, corporate, and everything in between.";
  const resolvedFootnote =
    footnote ??
    (session
      ? "Your account is ready.\nBook whenever you need to travel."
      : "Create an account in minutes.\nBook whenever you’re ready.");

  return (
    <section className="flex min-h-[90svh] flex-col items-center justify-center bg-void px-6 py-atlas-128">
      <div className="mx-auto flex w-full max-w-[44rem] flex-col items-center text-center">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          custom={0}
          className="font-instrument text-[48px] font-normal leading-[1.05] tracking-[-0.02em] text-paper md:text-[80px] lg:text-[96px]"
        >
          {resolvedTitle}
        </motion.h2>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          custom={0.1}
          className="mt-atlas-24 max-w-[34rem] text-balance font-display text-[17px] leading-[1.55] text-ash md:text-[20px]"
        >
          {resolvedDescription}
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          custom={0.18}
          className="mt-atlas-48 flex flex-col items-center gap-5"
        >
          <Link
            href={resolvedHref}
            className="inline-flex h-[64px] min-w-[240px] items-center justify-center rounded-full bg-sapphire-volt px-10 font-body text-[17px] font-normal text-paper transition-colors duration-200 hover:bg-[#000d6b] md:h-[72px] md:min-w-[280px] md:text-[22px]"
          >
            {resolvedLabel}
          </Link>
          <p className="max-w-[300px] whitespace-pre-line font-mono text-[12px] leading-[1.55] text-ash">
            {resolvedFootnote}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
