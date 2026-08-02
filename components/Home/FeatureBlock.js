"use client";

import React from "react";
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

/** Section 4 — Atlas “paradise” feature block */
export default function FeatureBlock({
  title = (
    <>
      The chauffeur
      <br />
      industry, digitized.
    </>
  ),
  description = "Chauff connects you with dedicated chauffeurs and curated partners—not casual drivers. Browse in app, book with clarity, and travel with the quiet confidence of a true professional.",
}) {
  return (
    <section
      className="flex min-h-[125svh] flex-col items-center justify-center px-6 py-atlas-128"
      style={{ backgroundColor: "#121212" }}
    >
      <div className="mx-auto flex w-full max-w-[90rem] flex-col items-center px-2 text-center">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          custom={0}
          className="font-instrument text-[64px] font-normal leading-[1.01] tracking-[-0.02em] text-frost md:whitespace-nowrap md:text-[128px] lg:text-[156px]"
        >
          {title}
        </motion.h2>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          custom={0.18}
          className="mt-atlas-24 max-w-[42rem] text-balance font-instrument text-[20px] leading-[1.25] text-ash md:text-[36px]"
        >
          {description}
        </motion.p>
      </div>
    </section>
  );
}
