"use client";
import PreviousBooking from "../../components/Trips/PreviousBooking";
import OngoingBooking from "../../components/Trips/OngoingBooking";
import React from "react";
import RequestedBooking from "../../components/Trips/RequestedBooking";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

function TripsPage() {
  return (
    <main className="min-h-screen bg-[#f8f8f8] text-slate-900 pt-36 lg:pt-40 pb-24">
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 pb-10 text-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs text-slate-500 shadow-sm mb-6"
        >
          Your journeys
          <span className="text-slate-300">—</span>
          past, present, upcoming
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.1}
          className="text-4xl md:text-5xl lg:text-[3.2rem] font-bold tracking-tight leading-[1.1] mb-4
                     bg-gradient-to-b from-slate-900 via-slate-800 to-slate-500
                     bg-clip-text text-transparent"
        >
          My trips with Chauff
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.2}
          className="text-sm md:text-base text-slate-500 leading-relaxed max-w-xl mx-auto"
        >
          See what&apos;s on the road right now, manage upcoming rides, and
          download receipts from previous trips — all in one clean view.
        </motion.p>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4">
        <OngoingBooking />
        <RequestedBooking />
        <PreviousBooking />
      </section>
    </main>
  );
}

export default TripsPage;
