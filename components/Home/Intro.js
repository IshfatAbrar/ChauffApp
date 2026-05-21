"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

function Intro() {
  const { data: session } = useSession();
  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-14 px-4 pt-20 lg:pt-0 lg:px-[15%] h-screen w-full">
      {/* Left — copy */}
      <div className="px-4 lg:px-0">
        {/* eyebrow pill */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs text-slate-500 shadow-sm mb-6"
        >
          Premium chauffeur service
          <span className="text-slate-300">—</span>
          built for you
        </motion.div>

        <motion.h2
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.1}
          className="text-4xl lg:text-7xl font-bold mb-4 leading-[1.1]
                     bg-gradient-to-b from-slate-900 via-slate-800 to-slate-500
                     bg-clip-text text-transparent"
        >
          Redefining the
          <br />
          Chauffeur Industry
        </motion.h2>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.2}
        >
          <p className="text-base lg:text-lg text-slate-500 max-w-[480px]">
            Simple, affordable, memorable
          </p>
          <p className="text-base lg:text-lg text-slate-500 max-w-[480px]">
            No cancellations. No waiting.
          </p>
        </motion.div>

        {/* logged-out CTAs */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.3}
          className={`mt-8 flex flex-row items-center gap-3 ${session ? "hidden" : ""}`}
        >
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white px-6 py-2.5 text-sm font-semibold hover:bg-slate-800 transition shadow-md"
          >
            Sign Up
          </Link>
          <Link
            href="/signin"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 px-6 py-2.5 text-sm font-medium hover:border-slate-300 hover:bg-slate-50 transition shadow-sm"
          >
            Have an account? Sign in
          </Link>
        </motion.div>

        {/* logged-in CTA */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.3}
          className={`mt-8 flex flex-row items-center gap-3 ${session ? "" : "hidden"}`}
        >
          <Link
            href="/book"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white px-6 py-2.5 text-sm font-semibold hover:bg-slate-800 transition shadow-md"
          >
            Book your ride
          </Link>
        </motion.div>
      </div>

      {/* Right — hero image */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0.2}
        className="relative w-full lg:w-[45%] h-[300px] lg:h-[500px]"
      >
        <Image
          src="/image_1.jpg"
          alt="Image"
          layout="fill"
          objectFit="cover"
          className="rounded-2xl"
        />
      </motion.div>
    </div>
  );
}

export default Intro;
