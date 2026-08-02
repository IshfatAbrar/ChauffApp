"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import HomeNavbar from "../../components/Home/HomeNavbar";
import PartnerHero from "../../components/Home/PartnerHero";
import FeatureBlock from "../../components/Home/FeatureBlock";
import ClosingCTA from "../../components/Home/ClosingCTA";
import AppStoreButtons from "../../components/Home/AppStoreButtons";

const ease = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease },
  }),
};

const TRUST_BADGES = [
  "< 5 min setup",
  "No upfront fees",
  "Stripe payouts",
  "Solo or fleet",
];

const STATS = [
  { value: "< 5 min", label: "to get started" },
  { value: "Real-time", label: "trip tracking" },
  { value: "100%", label: "transparent earnings" },
  { value: "24 / 7", label: "support available" },
];

const FEATURES = [
  {
    title: "Centralised Bookings",
    body: "Schedules, route details, and booking confirmations in one clean dashboard — whether you drive alone or manage a team.",
  },
  {
    title: "Transparent Earnings",
    body: "See trip revenue, platform fees, and chauffeur payouts per booking — no hidden deductions.",
  },
  {
    title: "Stripe Payouts",
    body: "Built-in Stripe Connect for solo operators and multi-driver partners, with clear settlement.",
  },
  {
    title: "Live Trip Tracking",
    body: "Monitor active trips in real time — from pickup to drop-off, across your operation.",
  },
  {
    title: "Driver Management",
    body: "Run as a solo chauffeur, or add and manage drivers independently as you grow.",
  },
  {
    title: "Built for Any Size",
    body: "Whether one vehicle or fifty, Chauff adapts to the structure and pace of your operation.",
  },
];

const DRIVER_APP_HIGHLIGHTS = [
  {
    title: "Accept trips",
    body: "New bookings land on your phone. Review the route, then accept or pass in one tap.",
  },
  {
    title: "Live status",
    body: "Mark arrive, start, and complete so partners and clients always know where the trip stands.",
  },
  {
    title: "Stay in sync",
    body: "Everything your chauffeurs do in the app shows up on the partner dashboard in real time.",
  },
];

export default function PartnerOnboardingPage() {
  return (
    <main className="min-h-screen bg-void font-display text-paper">
      <div className="bg-void">
        <HomeNavbar />
        <PartnerHero />
      </div>

      {/* Intro + network narrative + dashboard */}
      <section
        id="partner-content"
        className="px-6 pb-atlas-88 pt-atlas-64 md:px-10 md:pt-atlas-88"
      >
        <div className="mx-auto flex max-w-[44rem] flex-col items-center text-center">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            custom={0}
            className="bg-gradient-to-b from-[#f8f8f8] to-[#505050] bg-clip-text text-balance font-display text-[26px] font-normal leading-[1.35] tracking-[-0.004em] text-transparent md:text-[32px] md:leading-[1.32]"
          >
            Sign up and you join a network of professional chauffeurs — not just
            a booking app. Partner with others to share clients, cover more
            trips, and make sure every guest still gets a chauffeur at your
            standard when you can&apos;t take the ride yourself.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            custom={0.14}
            className="mt-atlas-48 flex flex-col items-center"
          >
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/partner/signup"
                className="inline-flex items-center justify-center rounded-full bg-sapphire-volt px-7 py-3 font-body text-[15px] text-paper transition-colors duration-200 hover:bg-[#000d6b]"
              >
                Create partner account
              </Link>
              <button
                type="button"
                onClick={() =>
                  (window.location.href =
                    "/signin?callbackUrl=/partner/dashboard")
                }
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-7 py-3 font-body text-[15px] text-frost transition-colors hover:border-white/30 hover:text-paper"
              >
                Sign in
              </button>
            </div>

            <div className="mt-atlas-32 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {TRUST_BADGES.map((b) => (
                <span
                  key={b}
                  className="font-mono text-[11px] uppercase tracking-[0.14em] text-ash"
                >
                  {b}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          custom={0.22}
          className="relative mx-auto mt-atlas-64 w-full max-w-4xl md:mt-atlas-88"
        >
          <Image
            src="/mac.png"
            alt="Chauff partner dashboard"
            width={1920}
            height={1080}
            className="h-auto w-full"
            sizes="(max-width: 896px) 100vw, 896px"
            priority={false}
          />
        </motion.div>
      </section>

      {/* Stats */}
      <section className="border-t border-white/10 px-6 py-atlas-64 md:px-10 md:py-atlas-88">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 text-center md:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease }}
            >
              <p className="mb-1 font-body text-[28px] text-paper md:text-[36px]">
                {stat.value}
              </p>
              <p className="font-body text-[11px] uppercase tracking-[0.14em] text-ash">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <FeatureBlock
        title={
          <>
            The chauffeur
            <br />
            industry, digitized.
          </>
        }
        description="Join a network of professional chauffeurs and fleets. Share clients, cover more trips, and run your operation from one dashboard — with tools built for partners, not rideshare."
      />

      {/* Features */}
      <section className="bg-void px-6 pb-atlas-128 pt-atlas-88 md:px-10">
        <div className="mx-auto w-full max-w-[72rem]">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              custom={i * 0.08}
              className="grid grid-cols-1 gap-6 border-t border-white/15 py-12 md:grid-cols-2 md:gap-16 md:py-16"
            >
              <h3 className="max-w-[14ch] font-display text-[28px] font-bold leading-[1.2] tracking-[-0.01em] text-paper md:text-[36px]">
                {f.title}
              </h3>
              <p className="max-w-[36rem] font-display text-[17px] font-normal leading-[1.55] text-frost md:text-[19px] md:leading-[1.5]">
                {f.body}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Driver mobile apps */}
      <section className="overflow-x-clip bg-void px-6 py-atlas-88 md:px-10 md:py-atlas-128">
        <div className="mx-auto w-full max-w-[72rem]">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-4 xl:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, ease }}
              className="mx-auto w-full max-w-md text-center lg:mx-0 lg:max-w-none lg:text-left"
            >
              <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-ash">
                Driver app
              </p>
              <h2 className="font-instrument text-[56px] font-normal leading-[1.02] tracking-[-0.02em] text-paper md:text-[72px] lg:text-[104px]">
                Built for
                <br />
                the road.
              </h2>
              <p className="mt-atlas-24 max-w-[28rem] font-display text-[16px] leading-[1.55] text-ash md:text-[18px] lg:max-w-[32rem]">
                Your chauffeurs run trips from iOS and Android — accept
                bookings, update status, and stay synced with your dashboard
                without leaving the vehicle.
              </p>

              <div className="mt-atlas-48 flex justify-center lg:justify-start">
                <AppStoreButtons variant="partner" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1, ease }}
              className="relative mx-auto w-full max-w-[22rem] sm:max-w-[26rem] lg:-translate-y-8 lg:max-w-[32rem] xl:-translate-y-12"
            >
              <Image
                src="/phone.png"
                alt="Chauff driver app on mobile"
                width={1200}
                height={1500}
                className="h-auto w-full border-0 outline-none"
                sizes="(max-width: 1024px) 26rem, 32rem"
                priority={false}
              />
            </motion.div>
          </div>

          <div className="mt-atlas-48 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-12 lg:mt-atlas-64">
            {DRIVER_APP_HIGHLIGHTS.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06, ease }}
              >
                <h3 className="mb-2 font-body text-[16px] text-paper">
                  {item.title}
                </h3>
                <p className="font-display text-[14px] leading-[1.6] text-ash">
                  {item.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <FeatureBlock
        title={
          <>
            Your clients,
            <br />
            always covered.
          </>
        }
        description="When you can’t take a trip, your network can. Partner with chauffeurs at your standard so every guest still gets the private travel experience they booked."
      />

      <ClosingCTA
        title={
          <>
            Ready to
            <br />
            go live?
          </>
        }
        description="Join partners already using Chauff to receive bookings, manage chauffeurs, and grow revenue — with zero friction."
        primaryHref="/partner/signup"
        primaryLabel="Create partner account"
        footnote={"Under 5 minutes to set up.\nNo upfront fees."}
      />
    </main>
  );
}
