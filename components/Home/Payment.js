import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

function Payment() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center gap-6 bg-[#f8f8f8] w-full py-16"
    >
      <h2 className="text-slate-300 hover:text-slate-400 duration-300">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-16 h-16"
        >
          <path
            fillRule="evenodd"
            d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08Zm3.094 8.016a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
            clipRule="evenodd"
          />
        </svg>
      </h2>
      <div className="px-8 lg:px-0 text-center">
        <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-3">
          Payments
        </p>
        <h2
          className="text-4xl font-bold mb-4 max-w-[700px] mx-auto
                       bg-gradient-to-b from-slate-900 via-slate-800 to-slate-500
                       bg-clip-text text-transparent leading-[1.15]"
        >
          Secure and seamless cashless payments.
        </h2>
        <div>
          <p className="text-sm text-slate-500 max-w-[520px] mx-auto leading-relaxed">
            Experience peace of mind with our secure payment method for your
            chauffeur service needs. At Chauff, we prioritize the security of
            your transactions, implementing industry-leading encryption
            protocols to safeguard your sensitive information.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/about#payment"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 px-5 py-2 text-sm font-medium hover:border-slate-300 hover:bg-slate-50 transition shadow-sm"
            >
              More about payments{" "}
              <i className="fa-solid fa-arrow-right ml-2"></i>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Payment;
