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

/** Section 2 — Atlas invite / waitlist narrative */
export default function Invite() {
  const { data: session } = useSession();
  const primaryHref = session ? "/book" : "/signup";
  const primaryLabel = session ? "Book a chauffeur" : "Sign up";

  return (
    <section
      id="invite"
      className="flex h-[115svh] flex-col items-center justify-center overflow-hidden bg-void px-6"
    >
      <div className="mx-auto flex w-full max-w-[42rem] flex-col items-center text-center">
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          custom={0}
          className="bg-gradient-to-b from-[#f8f8f8] to-[#505050] bg-clip-text text-balance font-display text-[26px] font-normal leading-[1.35] tracking-[-0.004em] text-transparent md:text-[32px] md:leading-[1.32]"
        >
          Rideshare is built for anyone behind the wheel. Chauff is built for
          chauffeurs—professionals who dedicate their craft to private travel.
          Book airport transfers, corporate journeys, and chauffeured tours
          through a platform designed around the standard you expect.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          custom={0.14}
          className="mt-24 flex flex-col items-center gap-5 md:mt-32"
        >
          <Link
            href={primaryHref}
            className="inline-flex h-[72px] min-w-[260px] items-center justify-center rounded-full bg-sapphire-volt px-10 font-body text-[19px] font-normal text-paper transition-colors duration-200 hover:bg-[#000d6b] md:h-[80px] md:min-w-[300px] md:text-[32px]"
          >
            {primaryLabel}
          </Link>

          <p className="max-w-[320px] whitespace-pre-line font-mono text-[12px] leading-[1.55] text-ash md:text-[13px]">
            {session
              ? "Your account is ready.\nBook a professional chauffeur anytime."
              : "Create an account in minutes.\nBook whenever you’re ready."}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
