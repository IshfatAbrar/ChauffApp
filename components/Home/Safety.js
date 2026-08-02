import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

function Safety() {
  return (
    <div className="mb-16">
      <div className="flex flex-col lg:flex-row items-center justify-center gap-24 pt-16 px-8">
        {/* Text and Button Column */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="lg:w-1/2 lg:px-0 lg:max-w-[500px]"
        >
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-3">
            Safety
          </p>
          <h1
            className="text-4xl font-bold mb-4
                         bg-gradient-to-b from-slate-900 via-slate-800 to-slate-500
                         bg-clip-text text-transparent leading-[1.15]"
          >
            Safety for all means looking out for our riders
          </h1>
          <p className="text-sm text-slate-500 text-justify lg:max-w-[450px] leading-relaxed">
            We believe transportation is a basic necessity. Getting to polling
            places, healthcare facilities, grocery stores, or to grandma&apos;s
            house for a visit. It all requires accessible, dependable
            transportation.
          </p>
          <div className="mt-8">
            <Link
              href="/safety"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 px-5 py-2 text-sm font-medium hover:border-slate-300 hover:bg-slate-50 transition shadow-sm"
            >
              More about Safety <i className="fa-solid fa-arrow-right ml-2"></i>
            </Link>
          </div>
        </motion.div>

        {/* Image Column */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center w-full lg:w-1/2"
        >
          <div className="w-full lg:w-4/5 h-auto">
            <Image
              src="/safety-home-page.jpg"
              alt="Image"
              height={550}
              width={550}
              className="rounded-2xl shadow-sm"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Safety;
