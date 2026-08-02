"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PaymentModal from "../../components/Booking/PaymentModal";
import HomeNavbar from "../../components/Home/HomeNavbar";

const REGIONS = [
  { code: "US", label: "United States", currency: "USD" },
  { code: "AU", label: "Australia", currency: "AUD" },
];

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-white/10 bg-graphite px-3.5 py-3 font-body text-[15px] text-paper placeholder-ash transition-colors focus:border-white/25 focus:outline-none";

export default function AccountPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const profileLoadedForUser = useRef(null);
  const paymentLoadedKey = useRef("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [region, setRegion] = useState("US");
  const [currency, setCurrency] = useState("USD");
  const [stripePublishableKey, setStripePublishableKey] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regionSaving, setRegionSaving] = useState(false);
  const [loadingPm, setLoadingPm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const email = session?.user?.email;
  const userId = session?.user?.id;
  const userRole = session?.user?.role;

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/signin");
      return;
    }
    if (userRole === "fleet") {
      router.replace("/partner/dashboard");
    }
  }, [status, userRole, router]);

  const loadPaymentMethod = useCallback(async (forRegion, forEmail) => {
    if (!forEmail || !forRegion) return;
    const key = `${forEmail}:${forRegion}`;
    paymentLoadedKey.current = key;
    setLoadingPm(true);
    try {
      const res = await fetch("/api/get-payment-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forEmail, region: forRegion }),
      });
      const data = await res.json();
      if (paymentLoadedKey.current === key) {
        setPaymentMethod(data.paymentMethod || null);
      }
    } catch {
      if (paymentLoadedKey.current === key) {
        setPaymentMethod(null);
      }
    } finally {
      if (paymentLoadedKey.current === key) {
        setLoadingPm(false);
      }
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    if (status !== "authenticated" || userRole !== "user" || !userId) {
      setLoading(false);
      return;
    }

    // Already loaded for this user (e.g. effect re-ran after success)
    if (profileLoadedForUser.current === userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/customer/me");
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load profile");
        if (cancelled) return;

        const nextRegion = data.user.region || "US";
        setName(data.user.name || "");
        setPhone(data.user.phone || "");
        setRegion(nextRegion);
        setCurrency(data.currency || "USD");
        setStripePublishableKey(data.stripePublishableKey || "");
        // Mark loaded only after success so Strict Mode / nav remounts can retry
        profileLoadedForUser.current = userId;

        // Sync JWT region in the background — awaiting update() can hang
        // and leave the page stuck on the loading screen.
        if (nextRegion && nextRegion !== session?.user?.region) {
          void update({ region: nextRegion });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load profile");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, userId, userRole]);
  useEffect(() => {
    if (loading || !email || !region) return;
    const key = `${email}:${region}`;
    if (paymentLoadedKey.current === key) return;
    loadPaymentMethod(region, email);
  }, [loading, email, region, loadPaymentMethod]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const payload = { name: name.trim(), phone: phone.trim() };
      if (password.trim().length >= 6) payload.password = password.trim();

      const res = await fetch("/api/customer/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");

      setName(data.user.name || "");
      setPhone(data.user.phone || "");
      setPassword("");
      setMessage("Your account was updated.");
    } catch (err) {
      setError(err.message || "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  const changeRegion = async (nextRegion) => {
    if (nextRegion === region || regionSaving) return;

    const confirmed = window.confirm(
      "Payment cards are stored per region. You'll need to re-add a card after switching. Continue?",
    );
    if (!confirmed) return;

    setRegionSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/customer/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region: nextRegion }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Region update failed");

      setRegion(data.user.region);
      setCurrency(data.currency || "USD");
      setStripePublishableKey(data.stripePublishableKey || "");
      void update({ region: data.user.region });
      setPaymentMethod(null);
      await loadPaymentMethod(data.user.region, email);
      setMessage(
        "Region updated. Add a payment card for this region if needed.",
      );
    } catch (err) {
      setError(err.message || "Could not change region.");
    } finally {
      setRegionSaving(false);
    }
  };

  const removePaymentMethod = async () => {
    if (!paymentMethod?.id) return;
    if (!window.confirm("Remove this card? You can add another anytime."))
      return;

    try {
      const res = await fetch("/api/detach-payment-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: paymentMethod.id }),
      });
      const data = await res.json();
      if (!res.ok && !data.success) {
        throw new Error(data.error || "Remove failed");
      }
      setPaymentMethod(null);
      setMessage("Payment method removed.");
    } catch (err) {
      setError(err.message || "Could not remove card.");
    }
  };

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-void font-display text-paper">
        <HomeNavbar />
        <p className="flex min-h-[50vh] items-center justify-center font-mono text-[12px] uppercase tracking-[0.18em] text-ash">
          Loading account…
        </p>
      </main>
    );
  }

  if (!session || session.user?.role !== "user") {
    return null;
  }

  const cardLabel = paymentMethod?.card
    ? `${(paymentMethod.card.brand || "CARD").toUpperCase()} •••• ${
        paymentMethod.card.last4
      }`
    : null;

  return (
    <main className="min-h-screen bg-void font-display text-paper">
      <HomeNavbar />

      <section className="mx-auto max-w-xl px-6 pb-atlas-128 pt-atlas-48 md:px-10 md:pt-atlas-64">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ash">
          Settings
        </p>
        <h1 className="font-instrument text-[48px] font-normal leading-[1.05] tracking-[-0.02em] text-paper md:text-[64px]">
          Account
        </h1>
        <p className="mt-3 font-body text-[15px] text-ash">{email}</p>

        {message ? (
          <p className="mt-6 rounded-xl border border-white/15 bg-white/5 px-3 py-2 font-body text-sm text-frost">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 font-body text-sm text-red-300">
            {error}
          </p>
        ) : null}

        <div className="mt-atlas-48 mb-6 rounded-2xl border border-white/10 bg-obsidian p-5">
          <h2 className="mb-1 font-body text-lg text-paper">Region</h2>
          <p className="mb-4 font-body text-sm text-ash">
            Currency and payments use your selected region ({currency}).
          </p>
          <div className="grid grid-cols-2 gap-3">
            {REGIONS.map((item) => {
              const active = region === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  disabled={regionSaving}
                  onClick={() => changeRegion(item.code)}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    active
                      ? "border-paper bg-paper text-black"
                      : "border-white/10 bg-graphite text-paper hover:border-white/25"
                  } ${regionSaving ? "opacity-60" : ""}`}
                >
                  <div className="font-body text-sm">{item.label}</div>
                  <div
                    className={`mt-1 font-mono text-[11px] ${
                      active ? "text-black/60" : "text-ash"
                    }`}
                  >
                    {item.code} · {item.currency}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <form
          onSubmit={saveProfile}
          className="mb-6 space-y-4 rounded-2xl border border-white/10 bg-obsidian p-5"
        >
          <h2 className="mb-1 font-body text-lg text-paper">Profile</h2>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
              Name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
              required
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
              Phone
            </span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={fieldClass}
              required
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
              New password (optional)
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
              minLength={6}
              placeholder="At least 6 characters"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-paper py-3.5 font-body text-[15px] text-black transition-opacity hover:opacity-85 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>

        <div className="mb-6 rounded-2xl border border-white/10 bg-obsidian p-5">
          <h2 className="mb-3 font-body text-lg text-paper">Payment method</h2>
          <div className="mb-3 flex min-h-[48px] items-center justify-between">
            {loadingPm ? (
              <p className="font-body text-sm text-ash">Loading…</p>
            ) : cardLabel ? (
              <>
                <p className="font-body text-paper">{cardLabel}</p>
                <button
                  type="button"
                  onClick={removePaymentMethod}
                  className="font-mono text-[11px] uppercase tracking-[0.12em] text-ash transition-colors hover:text-paper"
                >
                  Remove
                </button>
              </>
            ) : (
              <p className="font-body text-sm text-ash">No card on file</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(true)}
            className="w-full rounded-full border border-white/15 py-3 font-body text-[15px] text-frost transition-colors hover:border-white/30 hover:text-paper"
          >
            {cardLabel ? "Replace card" : "Add payment method"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full py-3 font-mono text-[12px] uppercase tracking-[0.14em] text-ash transition-colors hover:text-paper"
        >
          Sign out
        </button>
      </section>

      <PaymentModal
        isPaymentModalOpen={isPaymentModalOpen}
        setIsPaymentModalOpen={setIsPaymentModalOpen}
        onPaymentMethodUpdated={() => loadPaymentMethod(region, email)}
        customerRegion={region}
        stripePublishableKey={stripePublishableKey}
      />
    </main>
  );
}
