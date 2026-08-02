"use client";
import PreviousBooking from "../../components/Trips/PreviousBooking";
import OngoingBooking from "../../components/Trips/OngoingBooking";
import React from "react";
import RequestedBooking from "../../components/Trips/RequestedBooking";
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

function TripsPage() {
  return (
    <main className="min-h-screen bg-void font-display text-paper">
      <HomeNavbar />

      <section className="px-6 pb-atlas-48 pt-atlas-48 md:px-10 md:pt-atlas-64">
        <div className="mx-auto flex max-w-[44rem] flex-col items-center text-center">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="mb-6 font-mono text-[11px] uppercase tracking-[0.18em] text-ash"
          >
            Your journeys
          </motion.p>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.08}
            className="font-instrument text-[48px] font-normal leading-[1.05] tracking-[-0.02em] text-paper md:text-[72px] lg:text-[88px]"
          >
            My trips with Chauff
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.16}
            className="mt-atlas-24 max-w-[34rem] text-balance font-display text-[17px] leading-[1.55] text-ash md:text-[20px]"
          >
            See what&apos;s on the road right now, manage upcoming rides, and
            download receipts from previous trips — all in one clean view.
          </motion.p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-atlas-128 md:px-10">
        <OngoingBooking />
        <RequestedBooking />
        <PreviousBooking />
      </section>
    </main>
  );
}

export default TripsPage;
