"use client";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useSession } from "next-auth/react";
import CheckoutForm from "./../../components/CheckoutForm";
import React, { useEffect, useState } from "react";
import HomeNavbar from "../../components/Home/HomeNavbar";

function Payment() {
  const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  );

  const [clientSecret, setClientSecret] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const { data: session } = useSession();
  const email = session?.user?.email;

  useEffect(() => {
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

    if (email) {
      fetchPaymentMethod();
      createSetupIntent();
    }
  }, [email]);

  const options = { clientSecret: clientSecret };

  return (
    <main className="min-h-screen bg-void font-display text-paper">
      <HomeNavbar />
      <div className="mx-auto max-w-lg px-6 pb-atlas-128 pt-atlas-48 md:pt-atlas-64">
        {clientSecret ? (
          <div className="rounded-[24px] border border-white/10 bg-obsidian p-6 md:p-8">
            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm paymentMethod={paymentMethod} />
            </Elements>
          </div>
        ) : (
          <p className="text-center font-mono text-[12px] uppercase tracking-[0.18em] text-ash">
            Loading payment…
          </p>
        )}
      </div>
    </main>
  );
}

export default Payment;
