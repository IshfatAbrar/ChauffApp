"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const fieldClass =
  "mt-2 block w-full rounded-lg border border-black/10 bg-white/70 px-3.5 py-3 font-body text-[15px] text-black placeholder:text-black/35 transition-colors focus:border-black/30 focus:outline-none";

const ease = [0.22, 1, 0.36, 1];

function Arrow() {
  return (
    <span aria-hidden="true" className="ml-1.5 inline-block translate-y-[-0.5px]">
      →
    </span>
  );
}

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");
  const [authenticating, setAuthenticating] = useState(false);
  const router = useRouter();

  function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (authenticating) return;

    if (!name || !email || !password || !phone) {
      setError("All fields are necessary.");
      return;
    }

    if (password !== confirmPass) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setError("");
      setAuthenticating(true);
      const resUserExists = await fetch("api/userExists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          phone,
        }),
      });

      const { user } = await resUserExists.json();

      if (user) {
        setError("User already exists.");
        setAuthenticating(false);
        return;
      }

      if (!validateEmail(email)) {
        setError("Please enter a valid email address.");
        setAuthenticating(false);
        return;
      }

      const res = await fetch("api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
        }),
      });
      if (res.ok) {
        const form = e.target;
        form.reset();
        setError("");
        setAuthenticating(false);
        router.push("/signin");
      } else {
        console.log("User registration failed");
        setError("Registration failed. Please try again.");
        setAuthenticating(false);
      }
    } catch (error) {
      console.log("Error during registration: ", error);
      setError("Something went wrong. Please try again.");
      setAuthenticating(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 md:px-6">
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="scale-125 object-cover object-center blur-3xl"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease }}
        className="relative z-10 flex w-full max-w-[420px] flex-col bg-[#F2F0E9] px-7 py-8 text-black shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:max-w-[460px] md:px-9 md:py-10"
      >
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-body text-[32px] font-bold leading-[1.15] tracking-[-0.02em] md:text-[36px]">
              Create account
            </h1>
            <p className="mt-3 max-w-[30ch] font-body text-[15px] leading-[1.55] text-black/55">
              Create your Chauff account and start booking.
            </p>
          </div>
          <Link
            href="/"
            aria-label="Close and return home"
            className="flex h-9 w-9 shrink-0 items-center justify-center text-black/70 transition-colors hover:text-black"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </Link>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 font-body text-sm text-red-700">
            {error}
          </p>
        )}

        <label className="mb-4 block">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-black/45">
            Name
          </span>
          <input
            onChange={(e) => setName(e.target.value)}
            type="text"
            placeholder="Name"
            className={fieldClass}
            disabled={authenticating}
            autoComplete="name"
          />
        </label>

        <label className="mb-4 block">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-black/45">
            Phone
          </span>
          <input
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            placeholder="Phone"
            className={fieldClass}
            disabled={authenticating}
            autoComplete="tel"
          />
        </label>

        <label className="mb-4 block">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-black/45">
            Email
          </span>
          <input
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className={fieldClass}
            disabled={authenticating}
            autoComplete="email"
          />
        </label>

        <label className="mb-4 block">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-black/45">
            Password
          </span>
          <input
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className={fieldClass}
            disabled={authenticating}
            autoComplete="new-password"
          />
        </label>

        <label className="mb-8 block">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-black/45">
            Confirm password
          </span>
          <input
            onChange={(e) => setConfirmPass(e.target.value)}
            type="password"
            placeholder="Confirm Password"
            className={fieldClass}
            disabled={authenticating}
            autoComplete="new-password"
          />
        </label>

        <div className="mt-auto flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={authenticating}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-black px-5 py-3.5 font-body text-[15px] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {authenticating ? (
              <span
                className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
                role="status"
              >
                <span className="sr-only">Loading...</span>
              </span>
            ) : (
              <>
                Create account
                <Arrow />
              </>
            )}
          </button>

          <Link
            href="/signin"
            className="inline-flex flex-1 items-center justify-center rounded-full border border-black/80 bg-transparent px-5 py-3.5 font-body text-[15px] text-black transition-colors hover:bg-black/5"
          >
            Sign in
            <Arrow />
          </Link>
        </div>

        <Link
          href="/partner"
          className="mt-8 inline-flex w-fit items-center font-mono text-[11px] uppercase tracking-[0.14em] text-black/55 underline underline-offset-4 transition-colors hover:text-black"
        >
          Partner sign up
          <Arrow />
        </Link>
      </motion.form>
    </main>
  );
}
