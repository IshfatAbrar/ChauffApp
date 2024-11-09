"use client";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useSession } from "next-auth/react";
import CheckoutForm from "./../../components/CheckoutForm";
import React, { useEffect, useState } from "react";

function Payment() {
  const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  );

  const [clientSecret, setClientSecret] = useState(null);
  const { data: session } = useSession();
  const email = session?.user?.email;

  useEffect(() => {
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
      createSetupIntent();
    }
  }, [email]);

  const options = {
    clientSecret: clientSecret,
  };

  return (
    clientSecret && (
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm />
      </Elements>
    )
  );
}

export default Payment;
