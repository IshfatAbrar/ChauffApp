import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import React, { useState } from "react";

function CheckoutForm({ paymentMethod, fetchPaymentMethod, onSuccess }) {
  console.log(paymentMethod);

  const stripe = useStripe();
  const elements = useElements();
  const [isEditing, setIsEditing] = useState(!paymentMethod);

  const detachPaymentMethod = async (id) => {
    if (!id) {
      console.warn("No payment method ID provided for detachment");
      return false;
    }
    
    try {
      const response = await fetch("/api/detach-payment-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (data.success) {
        console.log("Payment method detached:", data.detachedPaymentMethod);
        return true;
      } else {
        console.error("Failed to detach payment method:", data.error);
        // Don't throw error - just log it, as the new payment method is already set
        return false;
      }
    } catch (error) {
      console.error("Error detaching payment method:", error);
      // Don't throw error - just log it, as the new payment method is already set
      return false;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) {
      return;
    }
    
    // Store the old payment method ID before confirming the new one
    const oldPaymentMethodId = paymentMethod?.id;
    
    // First, confirm the new payment method setup
    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: "http://localhost:3000/payment",
      },
      redirect: "if_required",
    });

    if (error) {
      console.error("Error confirming setup:", error);
      return;
    }
    
    console.log("Payment setup successful, old payment ID:", oldPaymentMethodId);
    
    // Only after successful setup, detach the old payment method
    if (oldPaymentMethodId) {
      console.log("Detaching old payment method:", oldPaymentMethodId);
      await detachPaymentMethod(oldPaymentMethodId);
    }
    
    // Call onSuccess callback if provided (will close modal and update parent)
    if (onSuccess) {
      console.log("Calling onSuccess callback");
      await onSuccess();
    } else {
      // If no onSuccess callback, fetch payment method here
      await fetchPaymentMethod();
    }
  };

  return (
    <div className="flex w-full flex-col items-center justify-center text-paper">
      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
        Payment
      </p>
      <h2 className="mb-8 text-center font-instrument text-[28px] font-normal tracking-[-0.02em] text-paper">
        {paymentMethod
          ? "Manage Payment Information"
          : "Add Payment Information"}
      </h2>

      {paymentMethod && (
        <>
          <div className="mb-4">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
              Selected Payment Method
            </p>

            <div className="w-72 rounded-xl border border-white/10 bg-graphite px-4 py-3">
              <div className="flex flex-row items-center gap-6">
                <p className="text-lg text-frost">
                  <i className="fa-regular fa-credit-card fa-xl"></i>
                </p>
                <div>
                  <p className="font-body text-md text-paper">
                    <b>
                      {paymentMethod.card.brand.charAt(0).toUpperCase() +
                        paymentMethod.card.brand.slice(1)}{" "}
                      Card
                    </b>{" "}
                    **** {paymentMethod.card.last4}
                  </p>
                  <p className="font-mono text-xs text-ash">
                    Expires on {paymentMethod.card.exp_month}/
                    {paymentMethod.card.exp_year}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-ash">
            OR
          </p>
        </>
      )}

      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <PaymentElement />
        <button
          className="mt-4 w-full rounded-full bg-paper p-3 font-body text-[15px] text-black transition-opacity duration-200 hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!stripe}
        >
          {paymentMethod ? "Change Payment Method" : "Save Payment Info"}
        </button>
      </form>
    </div>
  );
}

export default CheckoutForm;
