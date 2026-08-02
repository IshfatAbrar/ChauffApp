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

const PROBLEMS = [
  {
    title: "Rideshare isn’t private travel",
    body: "Most platforms treat every trip the same. Guests who expect a chauffeur—on time, discreet, and in the right vehicle—are left guessing who will show up.",
  },
  {
    title: "Professionals get crowded out",
    body: "Career chauffeurs and fleets compete with casual drivers on tools built for volume, not standards. Quality gets lost in the noise.",
  },
  {
    title: "Coverage breaks when life happens",
    body: "When a chauffeur can’t take a trip, clients are often left scrambling. There’s no trusted network to hand the journey to someone at the same level.",
  },
];

const SOLUTIONS = [
  {
    title: "Built for chauffeurs",
    body: "Chauff is designed around private travel—airport transfers, corporate journeys, and chauffeured tours—with professionals who treat driving as a craft.",
  },
  {
    title: "One platform for clients and partners",
    body: "Book with clarity as a guest, or run your operation as a solo chauffeur or fleet. Same standard, transparent tools, and control where it belongs.",
  },
  {
    title: "A network that covers every trip",
    body: "Partners can share clients and cover each other’s bookings, so guests still get a chauffeur at your standard—even when you can’t take the ride yourself.",
  },
];

function AboutPage() {
  return (
    <main className="min-h-screen bg-void font-display text-paper">
      <HomeNavbar />

      {/* Hero */}
      <section className="px-6 pb-atlas-64 pt-atlas-48 md:px-10 md:pb-atlas-88 md:pt-atlas-64">
        <div className="mx-auto flex max-w-[44rem] flex-col items-center text-center">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="mb-6 font-mono text-[11px] uppercase tracking-[0.18em] text-ash"
          >
            About Chauff
          </motion.p>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.08}
            className="font-instrument text-[48px] font-normal leading-[1.05] tracking-[-0.02em] text-paper md:text-[72px] lg:text-[88px]"
          >
            Private travel,
            <br />
            done properly.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.16}
            className="mt-atlas-24 max-w-[34rem] text-balance font-display text-[17px] leading-[1.55] text-ash md:text-[20px]"
          >
            Chauff exists because professional chauffeurs and the people who book
            them deserve a platform built for private travel—not a rideshare
            marketplace dressed up for executives.
          </motion.p>
        </div>
      </section>

      {/* Mission */}
      <section className="border-t border-white/10 px-6 py-atlas-88 md:px-10">
        <div className="mx-auto max-w-[40rem]">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            custom={0}
            className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-ash"
          >
            Our mission
          </motion.p>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            custom={0.08}
            className="font-instrument text-[22px] leading-[1.35] tracking-[-0.01em] text-frost md:text-[28px]"
          >
            Raise the bar for private travel. Give chauffeurs a home built for
            their craft, give clients a booking experience they can trust, and
            make sure every journey is handled by someone who belongs behind the
            wheel of a chauffeured car.
          </motion.p>
        </div>
      </section>

      {/* The problem */}
      <section className="border-t border-white/10 px-6 py-atlas-88 md:px-10">
        <div className="mx-auto w-full max-w-[72rem]">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            custom={0}
            className="mb-atlas-48 max-w-[40rem]"
          >
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-ash">
              The problem
            </p>
            <h2 className="font-instrument text-[36px] font-normal leading-[1.1] tracking-[-0.02em] text-paper md:text-[48px]">
              The gap between rideshare and real chauffeurs.
            </h2>
            <p className="mt-atlas-24 font-display text-[16px] leading-[1.6] text-ash md:text-[18px]">
              When someone books private travel, they expect reliability,
              discretion, and a professional behind the wheel. Today’s options
              rarely deliver that end to end—and the chauffeurs who can are stuck
              on tools that weren’t made for them.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-atlas-48 md:grid-cols-3 md:gap-10">
            {PROBLEMS.map((item, i) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                custom={0.08 + i * 0.06}
              >
                <h3 className="mb-3 font-body text-[16px] text-paper">
                  {item.title}
                </h3>
                <p className="font-display text-[15px] leading-[1.6] text-ash">
                  {item.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The solution */}
      <section className="border-t border-white/10 px-6 py-atlas-88 md:px-10 md:pb-atlas-128">
        <div className="mx-auto w-full max-w-[72rem]">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            custom={0}
            className="mb-atlas-48 max-w-[40rem]"
          >
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-ash">
              The solution
            </p>
            <h2 className="font-instrument text-[36px] font-normal leading-[1.1] tracking-[-0.02em] text-paper md:text-[48px]">
              A platform for the standard you expect.
            </h2>
            <p className="mt-atlas-24 font-display text-[16px] leading-[1.6] text-ash md:text-[18px]">
              Chauff connects guests with dedicated chauffeurs and curated
              partners. Book with clarity. Operate with transparent tools. Keep
              every trip covered by professionals—not whoever is closest.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-atlas-48 md:grid-cols-3 md:gap-10">
            {SOLUTIONS.map((item, i) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                custom={0.08 + i * 0.06}
              >
                <h3 className="mb-3 font-body text-[16px] text-paper">
                  {item.title}
                </h3>
                <p className="font-display text-[15px] leading-[1.6] text-ash">
                  {item.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default AboutPage;
