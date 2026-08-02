"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import HomeNavbar from "../../components/Home/HomeNavbar";

const ease = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease },
  }),
};

export default function SafetyPage() {
  return (
    <main className="min-h-screen bg-void font-display text-paper">
      <HomeNavbar />

      <section className="px-6 pb-atlas-64 pt-atlas-48 md:px-10 md:pb-atlas-88 md:pt-atlas-64">
        <div className="mx-auto flex max-w-[44rem] flex-col items-center text-center">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="mb-6 font-mono text-[11px] uppercase tracking-[0.18em] text-ash"
          >
            Safety
          </motion.p>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.08}
            className="font-instrument text-[48px] font-normal leading-[1.05] tracking-[-0.02em] text-paper md:text-[72px] lg:text-[88px]"
          >
            Our commitment to safety
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.16}
            className="mt-atlas-24 max-w-[34rem] text-balance font-display text-[17px] leading-[1.55] text-ash md:text-[20px]"
          >
            We want you to move freely, make the most of your time, and be
            connected to the people and places that matter most to you.
            That&apos;s why we are committed to safety, from the creation of new
            standards to the development of technology with the aim of reducing
            incidents.
          </motion.p>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-atlas-88 md:px-10 md:pb-atlas-128">
        <div className="mx-auto flex max-w-[52rem] flex-col gap-atlas-48">
          <div className="grid gap-atlas-32 md:grid-cols-2">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              custom={0.08}
            >
              <h2 className="mb-2 font-body text-[16px] text-paper">
                An inclusive community
              </h2>
              <p className="max-w-[28rem] font-display text-[15px] leading-[1.6] text-ash">
                Millions of riders and drivers share a set of Community
                Guidelines, holding each other accountable to do the right
                thing.
              </p>
            </motion.div>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              custom={0.14}
            >
              <h2 className="mb-2 font-body text-[16px] text-paper">
                Support at every turn
              </h2>
              <p className="max-w-[28rem] font-display text-[15px] leading-[1.6] text-ash">
                A specially trained team is available 24/7. Reach them in the
                app, day or night, with any questions or safety concerns.
              </p>
            </motion.div>
          </div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            custom={0.1}
            className="relative aspect-[16/9] w-full overflow-hidden rounded-[24px]"
          >
            <Image
              src="/safety.jpeg"
              alt="Chauff safety"
              fill
              sizes="(max-width: 768px) 100vw, 52rem"
              className="object-cover"
            />
          </motion.div>
        </div>
      </section>
    </main>
  );
}
