"use client";
import React from "react";
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

export default function PaymentsPage() {
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
            Payments
          </motion.p>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.08}
            className="font-instrument text-[48px] font-normal leading-[1.05] tracking-[-0.02em] text-paper md:text-[72px] lg:text-[88px]"
          >
            All you need to know about Chauff payment methods
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.16}
            className="mt-atlas-24 max-w-[34rem] text-balance font-display text-[17px] leading-[1.55] text-ash md:text-[20px]"
          >
            Arrived at your destination? No need to reach for your wallet —
            payments with Chauff are cashless and convenient. You can pay with
            your credit card or Apple Pay, and you&apos;ll receive a receipt by
            email.
          </motion.p>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-atlas-88 md:px-10 md:pb-atlas-128">
        <div className="mx-auto max-w-[40rem] space-y-atlas-32">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            custom={0.08}
          >
            <h2 className="mb-2 font-body text-[16px] text-paper">
              Enjoy secure payments.
            </h2>
            <p className="font-display text-[15px] leading-[1.6] text-ash">
              Whether you&apos;re booking a ride for a special occasion or
              regular transportation, you can trust that your payment details
              are protected every step of the way. Your satisfaction and
              security are our top priorities.
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
              Unlock seamless transactions.
            </h2>
            <p className="font-display text-[15px] leading-[1.6] text-ash">
              Choose convenience and flexibility with secure payment options
              powered by Stripe. Pay with cards and digital wallets like Apple
              Pay and Google Pay through a user-friendly checkout.
            </p>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
