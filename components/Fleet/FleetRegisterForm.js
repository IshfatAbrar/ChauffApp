"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import HomeNavbar from "../Home/HomeNavbar";

const initialState = {
  contactName: "",
  businessName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  companyRegistrationNumber: "",
  street: "",
  city: "",
  state: "",
  postcode: "",
  website: "",
  partnerType: "solo",
  estimatedFleetSize: "1",
  notes: "",
};

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-graphite px-3.5 py-2.5 font-body text-sm text-paper placeholder-ash transition-colors focus:border-white/25 focus:outline-none";

const labelClass =
  "mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-ash";

export default function FleetRegisterForm() {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const onChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "partnerType") {
        next.estimatedFleetSize =
          value === "solo" ? "1" : prev.estimatedFleetSize === "1" ? "" : prev.estimatedFleetSize;
      }
      return next;
    });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const {
      contactName,
      businessName,
      email,
      phone,
      password,
      confirmPassword,
      partnerType,
      estimatedFleetSize,
    } = form;

    if (!contactName || !businessName || !email || !phone || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...form,
        estimatedFleetSize:
          partnerType === "solo"
            ? 1
            : estimatedFleetSize
              ? Number(estimatedFleetSize)
              : undefined,
      };

      const res = await fetch("/api/fleet/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Unable to create partner account.");
        setSubmitting(false);
        return;
      }

      setSuccess(
        data.message ||
          "Partner account created. Redirecting you to sign in…"
      );
      setForm(initialState);

      setTimeout(() => {
        router.push("/signin?callbackUrl=/partner/dashboard");
      }, 1500);
    } catch (err) {
      console.error("Partner registration error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isSolo = form.partnerType === "solo";

  return (
    <main className="min-h-screen bg-void font-display text-paper">
      <HomeNavbar />
      <div className="flex items-center justify-center px-4 pb-atlas-88 pt-atlas-48 md:pt-atlas-64">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-3xl space-y-8 rounded-[24px] border border-white/10 bg-obsidian p-6 md:p-8"
        >
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ash">
              Partner with Chauff
            </p>
            <h1 className="mb-3 font-instrument text-[32px] font-normal tracking-[-0.02em] text-paper md:text-[42px]">
              Create your partner account
            </h1>
            <p className="font-body text-sm text-ash">
              For independent chauffeurs and fleet operators. One account to
              receive bookings, manage payouts, and grow with Chauff.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 font-body text-sm text-red-300">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-body text-sm text-frost">
              {success}
            </div>
          )}

          <div>
            <p className={labelClass}>I am joining as *</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                {
                  value: "solo",
                  title: "Solo chauffeur",
                  desc: "I drive myself — a one-person operation.",
                },
                {
                  value: "fleet",
                  title: "Fleet operator",
                  desc: "I manage multiple chauffeurs or vehicles.",
                },
              ].map((option) => {
                const selected = form.partnerType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      onChange("partnerType")({ target: { value: option.value } })
                    }
                    className={`rounded-xl border px-4 py-3.5 text-left transition-colors ${
                      selected
                        ? "border-paper bg-white/5"
                        : "border-white/10 hover:border-white/25"
                    }`}
                  >
                    <p className="font-body text-sm text-paper">{option.title}</p>
                    <p className="mt-1 font-mono text-[11px] leading-[1.45] text-ash">
                      {option.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Primary contact name *</label>
                <input
                  type="text"
                  value={form.contactName}
                  onChange={onChange("contactName")}
                  className={fieldClass}
                  placeholder="e.g. Jane Smith"
                />
              </div>
              <div>
                <label className={labelClass}>
                  {isSolo ? "Trading / business name *" : "Business / fleet name *"}
                </label>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={onChange("businessName")}
                  className={fieldClass}
                  placeholder={
                    isSolo
                      ? "e.g. Jane Smith Chauffeur"
                      : "e.g. Elite Executive Transfers"
                  }
                />
              </div>
              <div>
                <label className={labelClass}>Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={onChange("email")}
                  className={fieldClass}
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label className={labelClass}>Phone *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={onChange("phone")}
                  className={fieldClass}
                  placeholder="+61 400 000 000"
                />
              </div>
              <div>
                <label className={labelClass}>
                  Company registration number
                </label>
                <input
                  type="text"
                  value={form.companyRegistrationNumber}
                  onChange={onChange("companyRegistrationNumber")}
                  className={fieldClass}
                  placeholder="ABN / ACN (optional)"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className={labelClass}>Password *</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={onChange("password")}
                    className={fieldClass}
                    placeholder="Create a secure password"
                  />
                </div>
                <div>
                  <label className={labelClass}>Confirm password *</label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={onChange("confirmPassword")}
                    className={fieldClass}
                    placeholder="Re-enter your password"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Website</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={onChange("website")}
                  className={fieldClass}
                  placeholder="https://yourcompany.com"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {!isSolo && (
                  <div>
                    <label className={labelClass}>Number of chauffeurs</label>
                    <input
                      type="number"
                      min="2"
                      value={form.estimatedFleetSize}
                      onChange={onChange("estimatedFleetSize")}
                      className={fieldClass}
                      placeholder="e.g. 12"
                    />
                  </div>
                )}
                <div className={!isSolo ? "" : "sm:col-span-2"}>
                  <label className={labelClass}>City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={onChange("city")}
                    className={fieldClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Notes (vehicles, coverage areas, special requirements)
                </label>
                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={onChange("notes")}
                  className={`${fieldClass} resize-none`}
                  placeholder={
                    isSolo
                      ? "Tell us about your vehicle, service areas, and how you operate."
                      : "Tell us a bit more about your fleet and how you operate."
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-md font-mono text-[11px] leading-[1.55] text-ash">
              By submitting, you create a partner account and can sign in to the
              partner dashboard. Connect Stripe in Payments to receive payouts.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex items-center justify-center rounded-full px-7 py-3 font-body text-[15px] transition ${
                submitting
                  ? "cursor-not-allowed bg-graphite text-ash"
                  : "bg-paper text-black hover:opacity-85"
              }`}
            >
              {submitting ? "Creating account..." : "Create partner account"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
