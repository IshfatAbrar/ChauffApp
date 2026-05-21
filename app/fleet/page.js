"use client";
import Link from "next/link";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

const TRUST_BADGES = [
  "< 5 min setup",
  "No upfront fees",
  "Stripe payouts",
  "Works with any fleet",
];

const STATS = [
  { value: "< 5 min", label: "to get started" },
  { value: "Real-time", label: "trip tracking" },
  { value: "100%", label: "transparent earnings" },
  { value: "24 / 7", label: "support available" },
];

const FEATURES = [
  {
    badge: "Dashboard",
    title: "Centralised bookings",
    desc: "All driver schedules, route details, and booking confirmations in one clean dashboard.",
  },
  {
    badge: "Finance",
    title: "Transparent earnings",
    desc: "See trip revenue, platform fees, and driver payouts per booking — no hidden deductions.",
  },
  {
    badge: "Payments",
    title: "Stripe payouts",
    desc: "Built-in Stripe Connect supporting multiple drivers and automatic weekly settlement.",
  },
  {
    badge: "Live",
    title: "Live trip tracking",
    desc: "Monitor active trips in real time — from pickup to drop-off, across your entire fleet.",
  },
  {
    badge: "Operations",
    title: "Driver management",
    desc: "Add, edit, and manage drivers independently. Assign vehicles and set availability.",
  },
  {
    badge: "Scalable",
    title: "Built for any fleet size",
    desc: "Whether 5 vehicles or 50, Chauff adapts to the structure and pace of your operation.",
  },
];

/* ─── Mini Dashboard Demo ──────────────────────────────── */
function DashboardDemo() {
  return (
    <div className="w-full max-w-lg mx-auto rounded-2xl border border-slate-200 bg-slate-50 shadow-xl overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-300 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-slate-900"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 0M13 16l-2 0M13 16h2m-2 0H9m10 0h1a1 1 0 001-1v-4a1 1 0 00-.553-.894L18 9h-5v7h2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 leading-none">
              Fleet Dashboard
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              3 drivers active
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Live
        </span>
      </div>

      {/* active trip row */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-3">
          Active trips
        </p>
        <div className="space-y-2.5">
          {[
            {
              initials: "JW",
              name: "James W.",
              route: "Heathrow → Mayfair",
              status: "En route",
              pct: 62,
              color: "emerald",
            },
            {
              initials: "SR",
              name: "Sarah R.",
              route: "Canary Wharf → Gatwick",
              status: "Picking up",
              pct: 14,
              color: "amber",
            },
          ].map((d) => (
            <div key={d.name} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-semibold text-slate-600 shrink-0">
                {d.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[12px] font-medium text-slate-800 truncate">
                    {d.name}
                  </p>
                  <span
                    className={`text-[10px] font-medium ml-2 shrink-0 ${d.color === "emerald" ? "text-slate-600" : "text-slate-600"}`}
                  >
                    {d.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate mb-1">
                  {d.route}
                </p>
                <div className="h-1 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${d.color === "emerald" ? "bg-slate-500" : "bg-slate-400"}`}
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* metrics row */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 px-2">
        {[
          { label: "Today's revenue", value: "£840" },
          { label: "Trips completed", value: "7" },
          { label: "Upcoming", value: "3" },
        ].map((m) => (
          <div key={m.label} className="py-4 px-3 text-center">
            <p className="text-base font-semibold text-slate-900">{m.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
              {m.label}
            </p>
          </div>
        ))}
      </div>

      {/* footer */}
      <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 border-t border-slate-100">
        <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
          <svg
            className="w-3.5 h-3.5 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>
        <p className="text-[12px] text-slate-400">
          Add driver or assign booking.
        </p>
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────── */
export default function FleetOnboardingPage() {
  return (
    <main className="min-h-screen bg-[#f8f8f8] text-slate-900 pt-36 lg:pt-40">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 pb-10 text-center">
        {/* pill badge */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs text-slate-500 shadow-sm mb-8"
        >
          Fleet partnerships
          <span className="text-slate-300">—</span>
          built for your business
        </motion.div>

        {/* headline — gradient text */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.1}
          className="text-4xl md:text-9xl lg:text-[3.6rem] font-bold tracking-tight leading-[1.1] mb-12
                     bg-gradient-to-b from-slate-900 via-slate-800 to-slate-500
                     bg-clip-text text-transparent"
        >
          Onboard your fleet
          <br />
          with Chauff
        </motion.h1>

        {/* sub-copy */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.2}
          className="text-sm md:text-base text-slate-500 leading-relaxed mb-12 max-w-xl mx-auto"
        >
          Connect your professional fleet to a premium network of corporate and
          leisure travellers. Demand, tools, and transparent payouts — while you
          stay in full control.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.3}
          className="flex items-center justify-center gap-3 mb-12"
        >
          <Link
            href="/fleet/signup"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white px-6 py-2.5 text-sm font-semibold hover:bg-slate-800 transition shadow-md"
          >
            Create fleet account
          </Link>
          <button
            type="button"
            onClick={() =>
              (window.location.href = "/signin?callbackUrl=/fleet/dashboard")
            }
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 px-6 py-2.5 text-sm font-medium hover:border-slate-300 hover:bg-slate-50 transition shadow-sm"
          >
            Sign in
          </button>
        </motion.div>

        {/* trust badges */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.4}
          className="flex flex-wrap items-center justify-center gap-2"
        >
          {TRUST_BADGES.map((b) => (
            <span
              key={b}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-500 shadow-sm"
            >
              {b}
            </span>
          ))}
        </motion.div>
      </section>

      {/* ── Dashboard demo ───────────────────────────────── */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0.55}
        className="max-w-lg mx-auto px-4 pb-20"
      >
        <DashboardDemo />
      </motion.section>

      {/* ── Stats ────────────────────────────────────────── */}
      <div className="border-t border-slate-200" />

      <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <p
                className="text-2xl md:text-3xl font-semibold
                            bg-gradient-to-b from-slate-900 to-slate-500
                            bg-clip-text text-transparent mb-1"
              >
                {stat.value}
              </p>
              <p className="text-xs text-slate-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <div className="border-t border-slate-200" />

      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-3">
            Why choose Chauff
          </p>
          <h2
            className="text-2xl md:text-3xl font-bold tracking-tight max-w-lg
                         bg-gradient-to-b from-slate-900 to-slate-600
                         bg-clip-text text-transparent"
          >
            Everything you need, nothing you don&apos;t.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
            >
              <span className="text-[10px] uppercase tracking-widest text-slate-400 mb-3 block">
                {f.badge}
              </span>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                {f.title}
              </h3>
              <p className="text-[13px] text-slate-500 leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <div className="border-t border-slate-200" />

      <section className="max-w-3xl mx-auto px-4 py-20 md:py-28 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-4">
            Ready to launch
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4
                         bg-gradient-to-b from-slate-900 to-slate-500
                         bg-clip-text text-transparent"
          >
            Your fleet, live in minutes.
          </h2>
          <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
            Join fleets already using Chauff to manage drivers, receive
            bookings, and grow revenue — with zero friction.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/fleet/signup"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white px-7 py-3 text-sm font-semibold hover:bg-slate-800 transition shadow-lg"
            >
              Create fleet account
            </Link>
            <button
              type="button"
              onClick={() =>
                (window.location.href = "/signin?callbackUrl=/fleet/dashboard")
              }
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 px-7 py-3 text-sm font-medium hover:border-slate-300 transition shadow-sm"
            >
              Sign in →
            </button>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
