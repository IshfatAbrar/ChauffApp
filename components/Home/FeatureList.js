"use client";

import React from "react";
import Image from "next/image";
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

const features = [
  {
    title: "Curated Professional Partners",
    body: "Choose from vetted chauffeurs and executive vehicles—selected for discretion, reliability, and the standards of private travel.",
  },
  {
    title: "Book With Clarity",
    body: "Transparent rates and clear itineraries. Reserve airport transfers, corporate travel, and private journeys without the uncertainty of rideshare.",
  },
  {
    title: "A Chauffeur in Seconds",
    body: "Discover your destination, choose your chauffeur, and confirm inside the Chauff app—private travel booked in moments.",
  },
];

/** Full-bleed photo + Atlas-style feature rows (no logo badge) */
export default function FeatureList() {
  return (
    <>
      <section className="relative h-[100svh] min-h-[520px] w-full overflow-hidden bg-void">
        <Image
          src="/corporate.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority={false}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, #000000 100%)",
          }}
        />
      </section>

      <section className="bg-void px-6 pb-atlas-176 pt-atlas-88 md:px-10">
        <div className="mx-auto w-full max-w-[72rem]">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              custom={i * 0.08}
              className="grid grid-cols-1 gap-6 border-t border-white/15 py-12 md:grid-cols-2 md:gap-16 md:py-16"
            >
              <h3 className="max-w-[14ch] font-display text-[28px] font-bold leading-[1.2] tracking-[-0.01em] text-paper md:text-[36px]">
                {feature.title}
              </h3>
              <p className="max-w-[36rem] font-display text-[17px] font-normal leading-[1.55] text-frost md:text-[19px] md:leading-[1.5]">
                {feature.body}
              </p>
            </motion.div>
          ))}
          <div className="border-t border-white/15" aria-hidden="true" />
        </div>
      </section>
    </>
  );
}
