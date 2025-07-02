import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import React, { useState } from "react";

function CheckoutForm({ paymentMethod, fetchPaymentMethod }) {
  console.log(paymentMethod);

  const stripe = useStripe();
  const elements = useElements();
  const [isEditing, setIsEditing] = useState(!paymentMethod);

  const detachPaymentMethod = async (id) => {
    try {
      const response = await fetch("/api/detach-payment-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (data.success) {
        console.log("Payment method detached:", data.detachedPaymentMethod);
      } else {
        console.error("Failed to detach payment method:", data.error);
      }
    } catch (error) {
      console.error("Error detaching payment method:", error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) {
      return;
    }
    await detachPaymentMethod(paymentMethod?.id);
    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: "http://localhost:3000/payment",
      },
      redirect: "if_required",
    });

    if (error) {
      console.error("Error confirming setup:", error);
    }
    fetchPaymentMethod();
  };

  return (
    <div className="flex flex-col justify-center items-center w-full">
      <h2 className="mb-8 font-bold">Enter Your Payment Information</h2>
      <div className="mb-4">
        <p className="text-sm mb-1">Selected Payment Method</p>

        <div className=" border-[#e4e4e4] w-72 border py-2 px-4 rounded-md">
          {paymentMethod && (
            <div className="flex flex-row gap-6 items-center">
              <p className="text-lg text-slate-300">
                <i class="fa-regular fa-credit-card fa-xl"></i>
              </p>
              <div>
                <p className=" text-md">
                  <b>
                    {paymentMethod.card.brand.charAt(0).toUpperCase() +
                      paymentMethod.card.brand.slice(1)}{" "}
                    Card
                  </b>{" "}
                  **** {paymentMethod.card.last4}
                </p>
                <p className=" text-xs text-slate-500">
                  Expires on {paymentMethod.card.exp_month}/
                  {paymentMethod.card.exp_year}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <p>OR</p>

      <form onSubmit={handleSubmit} className="max-w-md">
        <PaymentElement />
        <button
          className="w-full bg-black text-white p-2 rounded-lg mt-2"
          disabled={!stripe}
        >
          {paymentMethod ? "Change Payment Method" : "Save Payment Info"}
        </button>
      </form>
    </div>
  );
}

export default CheckoutForm;
