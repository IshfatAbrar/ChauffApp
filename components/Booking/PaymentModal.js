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
  // Use region-specific Stripe publishable key
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full relative max-h-[90vh] flex flex-col">
            <button
              className="absolute top-2 right-4 text-gray-600 hover:text-gray-800 z-10"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              ✕
            </button>
            <div className="overflow-y-auto py-10 px-4">
              {clientSecret && (
                <Elements stripe={stripePromise} options={options}>
                  <CheckoutForm
                    paymentMethod={paymentMethod}
                    fetchPaymentMethod={fetchPaymentMethod}
                    onSuccess={async () => {
                      // Update parent component's payment method first
                      if (onPaymentMethodUpdated) {
                        await onPaymentMethodUpdated();
                      }
                      // Then close modal
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
