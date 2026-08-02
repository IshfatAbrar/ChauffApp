"use client";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useSession } from "next-auth/react";
import CheckoutForm from "./../../components/CheckoutForm";
import React, { useEffect, useState } from "react";

function PaymentModal({
  isPaymentModalOpen,
  setIsPaymentModalOpen,
  onPaymentMethodUpdated,
  customerRegion,
  stripePublishableKey,
}) {
  const stripePromise = stripePublishableKey
    ? loadStripe(stripePublishableKey)
    : loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

  const [clientSecret, setClientSecret] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const { data: session } = useSession();
  const email = session?.user?.email;

  const createSetupIntent = async () => {
    try {
      const res = await fetch("/api/create-setup-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, region: customerRegion || "US" }),
      });
      const { client_secret } = await res.json();
      setClientSecret(client_secret);
    } catch (error) {
      console.error("Error creating setup intent:", error);
    }
  };
  const fetchPaymentMethod = async () => {
    try {
      const res = await fetch("/api/get-payment-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, region: customerRegion || "US" }),
      });
      const data = await res.json();
      setPaymentMethod(data.paymentMethod);
    } catch (error) {
      console.error("Error fetching payment method:", error);
    }
  };
  useEffect(() => {
    if (email && isPaymentModalOpen && customerRegion) {
      fetchPaymentMethod();
      createSetupIntent();
    }
  }, [email, isPaymentModalOpen, customerRegion]);

  const options = { clientSecret: clientSecret };

  return (
    <div>
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-white/10 bg-obsidian">
            <button
              className="absolute right-4 top-3 z-10 text-ash transition-colors hover:text-paper"
              onClick={() => setIsPaymentModalOpen(false)}
              aria-label="Close"
            >
              ✕
            </button>
            <div className="overflow-y-auto px-4 py-10">
              {clientSecret && (
                <Elements stripe={stripePromise} options={options}>
                  <CheckoutForm
                    paymentMethod={paymentMethod}
                    fetchPaymentMethod={fetchPaymentMethod}
                    onSuccess={async () => {
                      if (onPaymentMethodUpdated) {
                        await onPaymentMethodUpdated();
                      }
                      setIsPaymentModalOpen(false);
                    }}
                  />
                </Elements>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentModal;
