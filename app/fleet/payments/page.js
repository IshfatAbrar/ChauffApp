"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import FleetSubpageHero from "../../../components/Fleet/FleetSubpageHero";

export default function FleetPaymentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stripeStatus, setStripeStatus] = useState({
    loading: true,
    connected: false,
    verified: false,
    details_submitted: false,
  });
  const [loadingAction, setLoadingAction] = useState(false);
  const [bankDetails, setBankDetails] = useState(null);
  const [loadingBank, setLoadingBank] = useState(false);
  const [driverPaymentSettings, setDriverPaymentSettings] = useState({
    paymentType: "percentage_per_ride",
    fixedMonthlyAmount: 0,
    fixedPerRideAmount: 0,
    percentagePerRide: 90,
  });
  const [loadingPaymentSettings, setLoadingPaymentSettings] = useState(false);
  const [savingPaymentSettings, setSavingPaymentSettings] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin?callbackUrl=/fleet/payments");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role === "fleet") {
      fetchStripeStatus();
      fetchDriverPaymentSettings();
    }
  }, [session]);

  // Refresh status when page becomes visible (e.g., returning from Stripe)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        session?.user?.role === "fleet"
      ) {
        fetchStripeStatus();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [session]);

  // Fetch bank details when verified
  useEffect(() => {
    if (stripeStatus.verified) {
      fetchBankDetails();
    }
  }, [stripeStatus.verified]);

  const fetchStripeStatus = async () => {
    try {
      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const res = await fetch("/api/fleet/stripe/status", {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (res.ok) {
        setStripeStatus({
          loading: false,
          connected: !!data.details_submitted || data.isVerified === false, // If we have status, account exists
          verified: data.isVerified,
          details_submitted: data.details_submitted,
          requirements: data.requirements,
        });
      } else {
        // Handle error response
        setStripeStatus((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error("Error fetching stripe status", error);
      setStripeStatus((prev) => ({ ...prev, loading: false }));
    }
  };

  const createStripeAccount = async () => {
    setLoadingAction(true);
    try {
      const res = await fetch("/api/fleet/stripe/create-account", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        // Automatically start onboarding
        await startOnboarding();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to create account");
    } finally {
      setLoadingAction(false);
    }
  };

  const startOnboarding = async () => {
    setLoadingAction(true);
    try {
      const res = await fetch("/api/fleet/stripe/account-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnUrl: window.location.href,
          refreshUrl: window.location.href,
        }),
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = data.url;
      } else {
        alert("Failed to get onboarding link");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAction(false);
    }
  };

  const fetchBankDetails = async () => {
    setLoadingBank(true);
    try {
      const res = await fetch("/api/fleet/stripe/bank-details");
      const data = await res.json();
      if (res.ok && data.success) {
        setBankDetails(data);
      }
    } catch (error) {
      console.error("Error fetching bank details", error);
    } finally {
      setLoadingBank(false);
    }
  };

  const fetchDriverPaymentSettings = async () => {
    setLoadingPaymentSettings(true);
    try {
      const res = await fetch("/api/fleet/driver-payment-settings");
      const data = await res.json();
      if (res.ok && data.success) {
        setDriverPaymentSettings({
          paymentType: data.settings.paymentType || "percentage_per_ride",
          fixedMonthlyAmount: data.settings.fixedMonthlyAmount || 0,
          fixedPerRideAmount: data.settings.fixedPerRideAmount || 0,
          percentagePerRide: data.settings.percentagePerRide || 90,
        });
      }
    } catch (error) {
      console.error("Error fetching driver payment settings", error);
    } finally {
      setLoadingPaymentSettings(false);
    }
  };

  const saveDriverPaymentSettings = async () => {
    setSavingPaymentSettings(true);
    try {
      const res = await fetch("/api/fleet/driver-payment-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(driverPaymentSettings),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Driver payment settings saved successfully!");
      } else {
        alert(data.message || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving driver payment settings", error);
      alert("Failed to save settings");
    } finally {
      setSavingPaymentSettings(false);
    }
  };

  if (status === "loading" || stripeStatus.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f8f8]">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900 mb-3" />
          <p className="text-sm text-slate-500">Loading payments…</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f8f8] text-slate-900 pt-36 lg:pt-40 pb-16 md:pb-24">
      <FleetSubpageHero
        eyebrow={
          <>
            Payments
            <span className="text-slate-300">—</span>
            Stripe &amp; payouts
          </>
        }
        title="Payments & Stripe"
        description="Connect Stripe, verify your fleet account, and configure how drivers are paid for completed rides."
      />

      <div className="border-t border-slate-200" />

      <section className="max-w-5xl mx-auto px-4 pt-10 space-y-6">
        <div className="bg-white p-6 md:p-7 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-2">
            Stripe
          </p>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Onboarding status
          </h2>

          {stripeStatus.verified ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 text-green-800">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <div>
                <p className="font-medium">Stripe Onboarding Complete</p>
                <p className="text-sm text-green-700">
                  Your fleet account is fully verified and ready to receive
                  payments.
                </p>
              </div>
            </div>
          ) : stripeStatus.details_submitted ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 mb-6">
              <p className="font-medium">Verification In Progress</p>
              <p className="text-sm text-blue-700 mb-2">
                Your Stripe account is connected. Additional verification may be
                required to complete onboarding.
              </p>
              {stripeStatus.requirements?.errors &&
                stripeStatus.requirements.errors.length > 0 && (
                  <div className="mt-2 text-xs text-blue-600 bg-blue-100 p-2 rounded">
                    <p className="font-medium">Required:</p>
                    <p>{stripeStatus.requirements.errors[0].reason}</p>
                  </div>
                )}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 mb-6">
              <p className="font-medium">Action Required</p>
              <p className="text-sm text-amber-700">
                You must connect and verify your Stripe account to receive
                payments for your fleet.
              </p>
            </div>
          )}

          <div className="mt-6 flex items-center gap-4">
            {!stripeStatus.connected && !stripeStatus.details_submitted ? (
              <button
                onClick={createStripeAccount}
                disabled={loadingAction}
                className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-semibold shadow-md hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingAction ? "Setting up..." : "Connect with Stripe"}
              </button>
            ) : !stripeStatus.verified ? (
              <>
                <button
                  onClick={startOnboarding}
                  disabled={loadingAction}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-semibold shadow-md hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingAction
                    ? "Redirecting..."
                    : stripeStatus.requirements?.currently_due?.length > 0
                    ? "Complete Verification"
                    : stripeStatus.details_submitted
                    ? "Update Account Details"
                    : "Complete Onboarding"}
                </button>
                <button
                  onClick={fetchStripeStatus}
                  disabled={loadingAction}
                  className="text-slate-600 text-sm font-medium hover:text-slate-900 underline"
                >
                  Refresh Status
                </button>
              </>
            ) : (
              <button
                onClick={startOnboarding}
                disabled={loadingAction}
                className="text-slate-600 text-sm font-medium hover:text-slate-900 underline"
              >
                Update Stripe onboarding settings
              </button>
            )}
          </div>
        </div>

        {/* Bank Account Details Section */}
        {stripeStatus.verified && (
          <div className="bg-white p-6 md:p-7 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-1">
                  Payouts
                </p>
                <h2 className="text-lg font-semibold text-slate-900">
                  Bank account
                </h2>
              </div>
              <button
                onClick={startOnboarding}
                disabled={loadingAction}
                className="text-sm text-slate-600 hover:text-slate-900 underline"
              >
                Change Bank Account
              </button>
            </div>

            {loadingBank ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-sm text-slate-500">
                  Loading bank details...
                </p>
              </div>
            ) : bankDetails?.defaultBankAccount ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="w-5 h-5 text-slate-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      <p className="text-sm font-medium text-slate-900">
                        {bankDetails.defaultBankAccount.bankName ||
                          "Bank Account"}
                      </p>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Active
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mb-1">
                      Account ending in{" "}
                      <span className="font-medium">
                        ****{bankDetails.defaultBankAccount.last4}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {bankDetails.defaultBankAccount.accountHolderName}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {bankDetails.defaultBankAccount.currency.toUpperCase()} •{" "}
                      {bankDetails.defaultBankAccount.country}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-600">
                    💰 Earnings from completed rides will be deposited to this
                    account
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  No bank account found. Please complete your Stripe onboarding
                  to add a bank account.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Driver Payment Settings Section */}
        <div className="bg-white p-6 md:p-7 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-1">
                Drivers
              </p>
              <h2 className="text-lg font-semibold text-slate-900">
                Payment settings
              </h2>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Configure how drivers in your fleet are paid for completed rides.
              </p>
            </div>
          </div>

          {loadingPaymentSettings ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-sm text-slate-500">Loading payment settings...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Payment Type Selection */}
              <div>
                <label className="text-sm font-medium text-slate-900 mb-3 block">
                  Payment Method
                </label>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition">
                    <input
                      type="radio"
                      name="paymentType"
                      value="fixed_monthly"
                      checked={driverPaymentSettings.paymentType === "fixed_monthly"}
                      onChange={(e) =>
                        setDriverPaymentSettings({
                          ...driverPaymentSettings,
                          paymentType: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">Fixed Monthly Payout</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Pay drivers a fixed amount each month regardless of rides completed.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition">
                    <input
                      type="radio"
                      name="paymentType"
                      value="fixed_per_ride"
                      checked={driverPaymentSettings.paymentType === "fixed_per_ride"}
                      onChange={(e) =>
                        setDriverPaymentSettings({
                          ...driverPaymentSettings,
                          paymentType: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">Fixed Amount Per Ride</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Pay drivers a fixed amount for each completed ride.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition">
                    <input
                      type="radio"
                      name="paymentType"
                      value="percentage_per_ride"
                      checked={driverPaymentSettings.paymentType === "percentage_per_ride"}
                      onChange={(e) =>
                        setDriverPaymentSettings({
                          ...driverPaymentSettings,
                          paymentType: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">Percentage Per Ride</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Pay drivers a percentage of each ride&apos;s total price.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Amount Input Fields */}
              {driverPaymentSettings.paymentType === "fixed_monthly" && (
                <div>
                  <label className="text-sm font-medium text-slate-900 mb-2 block">
                    Monthly Amount (AUD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={driverPaymentSettings.fixedMonthlyAmount || ""}
                      onChange={(e) =>
                        setDriverPaymentSettings({
                          ...driverPaymentSettings,
                          fixedMonthlyAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Amount each driver will receive monthly.
                  </p>
                </div>
              )}

              {driverPaymentSettings.paymentType === "fixed_per_ride" && (
                <div>
                  <label className="text-sm font-medium text-slate-900 mb-2 block">
                    Amount Per Ride (AUD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={driverPaymentSettings.fixedPerRideAmount || ""}
                      onChange={(e) =>
                        setDriverPaymentSettings({
                          ...driverPaymentSettings,
                          fixedPerRideAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Fixed amount each driver will receive per completed ride.
                  </p>
                </div>
              )}

              {driverPaymentSettings.paymentType === "percentage_per_ride" && (
                <div>
                  <label className="text-sm font-medium text-slate-900 mb-2 block">
                    Percentage Per Ride (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={driverPaymentSettings.percentagePerRide || ""}
                      onChange={(e) =>
                        setDriverPaymentSettings({
                          ...driverPaymentSettings,
                          percentagePerRide: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-4 pr-12 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                      placeholder="90"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                      %
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Percentage of each ride&apos;s total price that drivers will receive. The
                    remaining percentage goes to your fleet.
                  </p>
                  {driverPaymentSettings.percentagePerRide > 0 && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800">
                        <strong>Example:</strong> For a $100 ride, drivers receive $
                        {((driverPaymentSettings.percentagePerRide / 100) * 100).toFixed(2)} and
                        your fleet receives $
                        {((1 - driverPaymentSettings.percentagePerRide / 100) * 100).toFixed(2)}.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Save Button */}
              <div className="pt-4 border-t border-slate-200">
                <button
                  onClick={saveDriverPaymentSettings}
                  disabled={savingPaymentSettings}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-semibold shadow-md hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingPaymentSettings ? "Saving..." : "Save payment settings"}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
