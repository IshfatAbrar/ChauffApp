import {
  PaymentElement,
  PaymentRequestButtonElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import React, { useEffect, useState } from "react";

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const [paymentRequest, setPaymentRequest] = useState(null);

  useEffect(() => {
    if (stripe) {
      const pr = stripe.paymentRequest({
        country: "US",
        currency: "usd",
        total: {
          label: "Total",
          amount: 5000, // Replace with your amount in cents
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      pr.canMakePayment().then((result) => {
        if (result) {
          setPaymentRequest(pr);
        }
      });
    }
  }, [stripe]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: "http://localhost:3000/trips",
      },
    });

    if (error) {
      console.error("Error confirming setup:", error);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center w-full py-64">
      <h2 className="m-5 font-bold">Enter Your Payment Information</h2>

      {/* Show Payment Request Button if available */}
      {paymentRequest && (
        <PaymentRequestButtonElement
          options={{ paymentRequest }}
          className="mb-4"
        />
      )}

      {/* Standard Card Payment Form */}
      <form onSubmit={handleSubmit} className="max-w-md">
        <PaymentElement />
        <button
          className="w-full bg-black text-white p-2 rounded-lg mt-2"
          disabled={!stripe}
        >
          Save Payment Info
        </button>
      </form>
    </div>
  );
}

export default CheckoutForm;
