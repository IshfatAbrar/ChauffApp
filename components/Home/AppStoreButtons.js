"use client";

import React, { useEffect, useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1];

const STORES = [
  {
    id: "google",
    label: "Google Play",
    icon: "fa-brands fa-google-play",
    iconClass: "text-[18px] sm:text-[22px] md:text-[24px]",
  },
  {
    id: "apple",
    label: "App Store",
    icon: "fa-brands fa-apple",
    iconClass: "text-[20px] sm:text-[22px] md:text-[24px]",
  },
];

/** Same freeze / frosted pill texture as the hero store badges */
const frostSurface = {
  background: "rgba(80, 70, 60, 0.45)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
};

const heroShell =
  "h-[46px] w-[148px] sm:h-[52px] sm:w-[168px] md:h-[60px] md:w-[190px]";
const partnerShell = "h-[52px] w-[168px] md:h-[56px] md:w-[180px]";

/**
 * Atlas-style expand: frost shell morphs via layoutId; icons/text fade separately
 * so they never stretch during the close animation.
 */
export default function AppStoreButtons({
  variant = "hero",
  className = "",
}) {
  const uid = useId();
  const [openId, setOpenId] = useState(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const shellClass = variant === "partner" ? partnerShell : heroShell;

  useEffect(() => {
    if (!openId) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId]);

  useEffect(() => {
    if (!openId) return;
    setEmail("");
    setStatus("idle");
    setMessage("");
  }, [openId]);

  const handleJoinWaitlist = async (e) => {
    e.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data?.message || "Something went wrong.");
        return;
      }

      setStatus("success");
      setMessage("You're on the waitlist.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Could not join the waitlist.");
    }
  };

  return (
    <div
      className={`relative flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3 md:gap-4 ${className}`}
    >
      {STORES.map((store) => {
        const isOpen = openId === store.id;
        const bgId = `store-frost-${uid}-${store.id}`;

        return (
          <div
            key={store.id}
            className={`relative shrink-0 ${shellClass} ${
              isOpen ? "z-40" : "z-0"
            }`}
          >
            {/* Collapsed pill */}
            {!isOpen && (
              <button
                type="button"
                aria-label={`Get it on ${store.label}`}
                aria-expanded={false}
                className="relative flex h-full w-full items-center gap-2.5 rounded-full px-4 text-pure-white transition-transform duration-300 ease-out hover:scale-[1.04] sm:gap-3 sm:px-5 md:gap-3.5 md:px-6"
                onClick={() => setOpenId(store.id)}
              >
                <motion.div
                  layoutId={bgId}
                  className={`absolute inset-0 -z-0 rounded-full ${
                    variant === "partner" ? "border border-white/15" : ""
                  }`}
                  style={frostSurface}
                  transition={{ layout: { duration: 0.5, ease } }}
                />
                <i
                  className={`${store.icon} relative z-10 block shrink-0 leading-none ${store.iconClass}`}
                  aria-hidden="true"
                  style={{ width: "1em", height: "1em" }}
                />
                <span className="relative z-10 flex min-w-0 flex-col items-start leading-none">
                  <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/85 sm:text-[9px] md:text-[10px]">
                    Get it on
                  </span>
                  <span className="mt-0.5 font-instrument text-[14px] font-medium tracking-[-0.01em] sm:mt-1 sm:text-[16px] md:text-[18px]">
                    {store.label}
                  </span>
                </span>
              </button>
            )}

            {/* Expanded card — same position, frost shell morphs in */}
            <AnimatePresence>
              {isOpen && (
                <div className="absolute bottom-0 left-0 z-40 w-[min(calc(100vw-2rem),24rem)] sm:w-[26rem] md:w-[28rem]">
                  <motion.div
                    layoutId={bgId}
                    className="absolute inset-0 rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.35)] md:rounded-[32px]"
                    style={{
                      ...frostSurface,
                      transformOrigin: "bottom left",
                    }}
                    transition={{ layout: { duration: 0.5, ease } }}
                  />

                  <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={`app-waitlist-title-${uid}-${store.id}`}
                    className="relative z-10 flex flex-col px-6 pb-6 pt-7 text-left text-paper md:px-8 md:pb-8 md:pt-8"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: 1,
                      transition: { duration: 0.18, delay: 0.14 },
                    }}
                    exit={{
                      opacity: 0,
                      transition: { duration: 0.1, delay: 0 },
                    }}
                  >
                    <div className="mb-4 flex items-center gap-2.5">
                      <i
                        className={`${store.icon} block shrink-0 text-[22px] leading-none text-paper`}
                        aria-hidden="true"
                        style={{ width: "1em", height: "1em" }}
                      />
                      <div className="flex flex-col leading-none">
                        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/80">
                          Get it on
                        </span>
                        <span className="mt-1 font-instrument text-[18px] font-medium tracking-[-0.01em]">
                          {store.label}
                        </span>
                      </div>
                    </div>

                    <h2
                      id={`app-waitlist-title-${uid}-${store.id}`}
                      className="font-instrument text-[28px] font-normal leading-[1.08] tracking-[-0.02em] text-paper md:text-[32px]"
                    >
                      Coming soon
                    </h2>
                    <p className="mt-3 font-display text-[14px] leading-[1.55] text-white/85 md:text-[15px]">
                      Our apps are still being finished. We&apos;re building a
                      chauffeur experience that matches the standard of private
                      travel—not a rushed rideshare download.
                    </p>
                    <p className="mt-3 font-display text-[14px] leading-[1.55] text-white/85 md:text-[15px]">
                      Join the waitlist and we&apos;ll let you know when Chauff
                      is ready on {store.label}.
                    </p>

                    <form
                      onSubmit={handleJoinWaitlist}
                      className="mt-6 flex flex-col gap-3"
                    >
                      <div className="flex items-stretch gap-2">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          required
                          disabled={status === "loading"}
                          autoComplete="email"
                          aria-label="Email for waitlist"
                          className="min-w-0 flex-1 rounded-xl border-0 bg-white/10 px-3.5 py-3 font-body text-[14px] text-paper placeholder:text-white/45 outline-none disabled:opacity-60"
                        />
                        <button
                          type="submit"
                          disabled={status === "loading"}
                          className="shrink-0 rounded-xl bg-[#E8E6E1] px-4 py-3 font-body text-[14px] font-medium text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5"
                        >
                          {status === "loading" ? "Joining…" : "Join waitlist"}
                        </button>
                      </div>

                      {message ? (
                        <p className="font-mono text-[11px] text-paper">
                          {message}
                        </p>
                      ) : null}
                    </form>

                    <div className="mt-5 flex justify-center">
                      <button
                        type="button"
                        aria-label="Close"
                        onClick={() => setOpenId(null)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25 text-white/85 transition-colors hover:border-white/45 hover:text-paper"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M3 3l10 10M13 3L3 13"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
