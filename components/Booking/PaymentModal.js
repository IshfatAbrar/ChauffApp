"use client";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useSession } from "next-auth/react";
import CheckoutForm from "./../../components/CheckoutForm";
import React, { useEffect, useState } from "react";

function PaymentModal({ isPaymentModalOpen, setIsPaymentModalOpen }) {
  const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  );

  const [clientSecret, setClientSecret] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const { data: session } = useSession();
  const email = session?.user?.email;

  const fetchPaymentMethod = async () => {
    try {
      const res = await fetch("/api/get-payment-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setPaymentMethod(data.paymentMethod);
    } catch (error) {
      console.error("Error fetching payment method:", error);
    }
  };
  const createSetupIntent = async () => {
    try {
      const res = await fetch("/api/create-setup-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const { client_secret } = await res.json();
      setClientSecret(client_secret);
    } catch (error) {
      console.error("Error creating setup intent:", error);
    }
  };
  useEffect(() => {
    if (email) {
      fetchPaymentMethod();
      createSetupIntent();
    }
  }, [email]);

  const options = { clientSecret: clientSecret };

  return (
    <div>
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white py-10 rounded-lg shadow-lg max-w-lg w-full relative mx-8">
            <button
              className="absolute top-2 right-4 text-gray-600 hover:text-gray-800"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              ✕
            </button>
            {clientSecret && (
              <Elements stripe={stripePromise} options={options}>
                <CheckoutForm
                  paymentMethod={paymentMethod}
                  fetchPaymentMethod={fetchPaymentMethod}
                />
              </Elements>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentModal;
