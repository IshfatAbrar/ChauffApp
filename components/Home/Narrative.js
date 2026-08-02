"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease },
  }),
};

export default function Narrative() {
  const { data: session } = useSession();
  const primaryHref = session ? "/book" : "/signup";
  const primaryLabel = session ? "Book your ride" : "Sign up";

  return (
    <section className="bg-void px-6 pb-atlas-176 pt-atlas-88">
      <div className="mx-auto flex w-full max-w-page flex-col items-center text-center">
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          custom={0}
          className="font-mono text-caption uppercase tracking-[0.18em] text-ash"
        >
          Premium chauffeur
        </motion.p>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          custom={0.08}
          className="mt-atlas-32 font-display text-[40px] font-bold leading-[1.17] tracking-[-0.008em] text-paper md:text-[48px]"
        >
          Chauff
        </motion.h1>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          custom={0.16}
          className="mt-atlas-48 space-y-atlas-32 font-display text-subheading font-normal tracking-[-0.004em] text-paper"
        >
          <p className="text-balance">
            Private chauffeur service for airport transfers, corporate travel,
            and the occasions that demand absolute reliability.
          </p>
          <p className="text-balance text-ash">
            No cancellations. No waiting. Just a quiet, precise ride from door
            to door.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          custom={0.28}
          className="mt-atlas-64 flex flex-col items-center gap-atlas-16"
        >
          <Link
            href={primaryHref}
            className="inline-flex min-w-[200px] items-center justify-center rounded-pills bg-sapphire-volt px-atlas-32 py-atlas-16 font-body text-body-lg font-normal text-paper transition-colors duration-200 hover:bg-[#000d6b]"
          >
            {primaryLabel}
          </Link>

          {!session && (
            <Link
              href="/signin"
              className="font-body text-body-lg text-paper underline decoration-graphite underline-offset-[3px] transition-colors duration-200 hover:text-sapphire-volt hover:decoration-sapphire-volt"
            >
              Already have an account? Sign in
            </Link>
          )}

          <p className="max-w-[320px] font-mono text-caption leading-[1.5] text-ash">
            Invitation-style onboarding. Existing members can sign in anytime.
            Partners and solo chauffeurs apply separately.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          custom={0.4}
          className="mt-atlas-128 flex flex-wrap items-center justify-center gap-x-atlas-32 gap-y-atlas-16 font-body text-body-lg text-frost"
        >
          <Link
            href="/book"
            className="transition-colors duration-200 hover:text-paper"
          >
            Point to point
          </Link>
          <Link
            href="/tour"
            className="transition-colors duration-200 hover:text-paper"
          >
            Tours
          </Link>
          <Link
            href="/about"
            className="transition-colors duration-200 hover:text-paper"
          >
            About
          </Link>
          <Link
            href="/partner"
            className="transition-colors duration-200 hover:text-paper"
          >
            Partners
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
