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

const points = [
  {
    title: "Calendar sync",
    body: "Connect Google Calendar or Apple Calendar so pickups, flights, and meetings stay aligned—and you never miss a trip.",
  },
  {
    title: "Live ride tracking",
    body: "Follow your chauffeur in real time from dispatch to the curb. Know where your ride is and when it will arrive.",
  },
];

/** Dedicated section — calendar sync + ride tracking */
export default function TripIntelligence() {
  return (
    <section
      className="flex min-h-[110svh] flex-col items-center justify-center px-6 py-atlas-128"
      style={{ backgroundColor: "#121212" }}
    >
      <div className="mx-auto flex w-full max-w-[52rem] flex-col items-center text-center">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          custom={0}
          className="font-instrument text-[48px] font-normal leading-[1.05] tracking-[-0.02em] text-frost md:text-[80px] lg:text-[96px]"
        >
          Never miss
          <br />
          a trip.
        </motion.h2>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          custom={0.1}
          className="mt-atlas-24 max-w-[36rem] text-balance font-display text-[17px] leading-[1.55] text-ash md:text-[20px]"
        >
          Chauff keeps your schedule and your chauffeur in the same place—so
          every journey shows up when it should, and stays visible until you
          arrive.
        </motion.p>

        <div className="mt-atlas-64 grid w-full max-w-[48rem] grid-cols-1 gap-12 border-t border-white/15 pt-atlas-48 md:mt-atlas-88 md:grid-cols-2 md:gap-16">
          {points.map((point, i) => (
            <motion.div
              key={point.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              custom={0.16 + i * 0.08}
              className="flex flex-col items-center text-center md:items-start md:text-left"
            >
              <h3 className="font-display text-[20px] font-bold text-paper md:text-[22px]">
                {point.title}
              </h3>
              <p className="mt-3 font-display text-[15px] leading-[1.6] text-ash md:text-[17px]">
                {point.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
