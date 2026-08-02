"use client";

import React, { useState } from "react";

export default function WaitlistPill({ className = "" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
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
    <div className={`w-full max-w-[420px] ${className}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
            style={{
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
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
          <p
            className="text-center font-mono text-[11px] text-paper"
          >
            {message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
