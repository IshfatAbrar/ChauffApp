"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import FleetPageHeader from "../../../components/Fleet/FleetPageHeader";
import DeleteStripeButton from "../../../components/Fleet/DeleteStripeButton";

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
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin?callbackUrl=/partner/payments");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role === "fleet") {
      fetchStripeStatus();
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

  if (status === "loading" || stripeStatus.loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-void">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-fleet-border border-t-paper" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-void pb-16 font-body text-paper md:pb-20">
      <section className="mx-auto max-w-5xl space-y-6 px-6 pt-8 md:px-8 md:pt-10">
        <FleetPageHeader
          title="Payments"
          description="Stripe onboarding and bank details for payouts."
        />

        <div className="rounded-2xl border border-fleet-border bg-obsidian p-5 md:p-6">
          <h2 className="mb-4 font-body text-[17px] font-medium text-paper">
            Stripe status
          </h2>

          {stripeStatus.verified ? (
            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3 text-emerald-300">
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
                <p className="text-sm text-emerald-200/90">
                  Your partner account is fully verified and ready to receive
                  payments.
                </p>
              </div>
            </div>
          ) : stripeStatus.details_submitted ? (
            <div className="bg-sky-500/20 border border-sky-500/30 rounded-xl p-4 text-sky-300 mb-6">
              <p className="font-medium">Verification In Progress</p>
              <p className="text-sm text-sky-200/90 mb-2">
                Your Stripe account is connected. Additional verification may be
                required to complete onboarding.
              </p>
              {stripeStatus.requirements?.errors &&
                stripeStatus.requirements.errors.length > 0 && (
                  <div className="mt-2 text-xs text-sky-200 bg-sky-500/20 p-2 rounded-lg">
                    <p className="font-medium">Required:</p>
                    <p>{stripeStatus.requirements.errors[0].reason}</p>
                  </div>
                )}
            </div>
          ) : (
            <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-4 text-amber-300 mb-6">
              <p className="font-medium">Action Required</p>
              <p className="text-sm text-amber-200/90">
                You must connect and verify your Stripe account to receive
                payments for your partner account.
              </p>
            </div>
          )}

          <div className="mt-6 flex items-center gap-4">
            {!stripeStatus.connected && !stripeStatus.details_submitted ? (
              <button
                onClick={createStripeAccount}
                disabled={loadingAction}
                className="rounded-full bg-paper text-fleet-on-paper px-6 py-2.5 text-sm font-semibold hover:opacity-85 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingAction ? "Setting up..." : "Connect with Stripe"}
              </button>
            ) : !stripeStatus.verified ? (
              <>
                <button
                  onClick={startOnboarding}
                  disabled={loadingAction}
                  className="rounded-full bg-paper text-fleet-on-paper px-6 py-2.5 text-sm font-semibold hover:opacity-85 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="text-frost text-sm font-medium hover:text-paper underline"
                >
                  Refresh Status
                </button>
              </>
            ) : (
              <button
                onClick={startOnboarding}
                disabled={loadingAction}
                className="text-frost text-sm font-medium hover:text-paper underline"
              >
                Update Stripe onboarding settings
              </button>
            )}
          </div>
        </div>

        {/* Bank Account Details Section */}
        {stripeStatus.verified && (
          <div className="rounded-2xl border border-fleet-border bg-obsidian p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-body text-[17px] font-medium text-paper">
                  Bank account
                </h2>
              </div>
              <button
                onClick={startOnboarding}
                disabled={loadingAction}
                className="text-sm text-frost hover:text-paper underline"
              >
                Change Bank Account
              </button>
            </div>

            {loadingBank ? (
              <div className="border border-fleet-border bg-graphite rounded-xl p-4">
                <p className="text-sm text-ash">
                  Loading bank details...
                </p>
              </div>
            ) : bankDetails?.defaultBankAccount ? (
              <div className="border border-fleet-border bg-graphite rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="w-5 h-5 text-frost"
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
                      <p className="text-sm font-medium text-paper">
                        {bankDetails.defaultBankAccount.bankName ||
                          "Bank Account"}
                      </p>
                      <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full">
                        Active
                      </span>
                    </div>
                    <p className="text-sm text-frost mb-1">
                      Account ending in{" "}
                      <span className="font-medium">
                        ****{bankDetails.defaultBankAccount.last4}
                      </span>
                    </p>
                    <p className="text-xs text-ash">
                      {bankDetails.defaultBankAccount.accountHolderName}
                    </p>
                    <p className="text-xs text-ash mt-1">
                      {bankDetails.defaultBankAccount.currency.toUpperCase()} â€¢{" "}
                      {bankDetails.defaultBankAccount.country}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-fleet-border">
                  <p className="text-xs text-ash">
                    Earnings from completed rides deposit to this account.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-4">
                <p className="text-sm text-amber-300">
                  No bank account found. Please complete your Stripe onboarding
                  to add a bank account.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="pt-2">
          <DeleteStripeButton />
        </div>
      </section>
    </main>
  );
}
