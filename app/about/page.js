"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

function AboutPage() {
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
          About Chauff
          <span className="text-slate-300">—</span>
          who we are
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
          We reimagine the way the world moves
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.2}
          className="text-sm md:text-base text-slate-500 leading-relaxed max-w-xl mx-auto"
        >
          Movement is what we power. It&apos;s our lifeblood. It&apos;s what
          gets us out of bed each morning and pushes us to design better ways to
          get you where you need to go.
        </motion.p>
      </section>

      {/* Content */}
      <section className="flex flex-col gap-16 max-w-3xl mx-auto px-4 pt-4">
        <section className="max-w-[800px] mx-auto w-full">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-3">
            Our mission
          </h2>
          <p className="text-md text-slate-500 leading-relaxed">
            Movement is what we power. It&apos;s our lifeblood. It runs through
            our veins. It&apos;s what gets us out of bed each morning. It pushes
            us to constantly reimagine how we can move better. For you. For all
            the places you want to go. For all the things you want to get. For
            all the ways you want to earn. Across the entire world. In real
            time. At the incredible speed of now.
          </p>
        </section>

        <section id="safety" className="w-full">
          <div className="flex flex-col items-center gap-10 w-full">
            <div className="w-full max-w-[800px] space-y-6">
              <div>
                <h2 className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-3">
                  Safety
                </h2>
                <h3 className="text-2xl font-semibold mb-3 text-slate-900">
                  Our commitment to safety
                </h3>
                <p className="text-md text-slate-500 leading-relaxed">
                  We want you to move freely, make the most of your time, and be
                  connected to the people and places that matter most to you.
                  That&apos;s why we are committed to safety, from the creation
                  of new standards to the development of technology with the aim
                  of reducing incidents.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1 text-slate-900">
                  An inclusive community
                </h3>
                <p className="text-sm text-slate-500 max-w-[500px] leading-relaxed">
                  Millions of riders and drivers share a set of Community
                  Guidelines, holding each other accountable to do the right
                  thing.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1 text-slate-900">
                  Support at every turn
                </h3>
                <p className="text-sm text-slate-500 max-w-[500px] leading-relaxed">
                  A specially trained team is available 24/7. Reach them in the
                  app, day or night, with any questions or safety concerns.
                </p>
              </div>
            </div>
            <div className="w-full max-w-xl">
              <Image
                src="/safety.jpeg"
                alt="Description of the image"
                layout="responsive"
                width={1200}
                height={400}
                objectFit="cover"
                className="object-cover rounded-2xl shadow-sm"
              />
            </div>
          </div>
        </section>

        <section id="payment" className="w-full">
          <div className="max-w-[800px] mx-auto w-full">
            <h2 className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-3">
              Payments
            </h2>
            <h3 className="text-2xl font-semibold mb-3 text-slate-900">
              All you need to know about Chauff payment methods
            </h3>
            <p className="text-md text-slate-500 leading-relaxed mb-6">
              Arrived at your destination? No need to reach for your wallet –
              payments with Chauff are cashless and convenient. You can pay with
              your credit card or Apple Pay, and you&apos;ll receive a receipt
              by email.
            </p>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-1">
                  Enjoy secure payments.
                </h4>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Whether you&apos;re booking a ride for a special occasion or
                  regular transportation, you can trust that your payment
                  details are protected every step of the way. Your satisfaction
                  and security are our top priorities.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-1">
                  Unlock seamless transactions.
                </h4>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Choose convenience and flexibility with secure payment options
                  powered by Stripe. Pay with cards and digital wallets like
                  Apple Pay and Google Pay through a user-friendly checkout.
                </p>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

export default AboutPage;
