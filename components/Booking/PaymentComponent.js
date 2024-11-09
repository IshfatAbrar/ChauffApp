import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { useState } from "react";

const PaymentMethodForm = ({ onPaymentMethodAdded }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
    });

    setLoading(false);

    if (error) {
      console.error(error);
    } else {
      onPaymentMethodAdded(paymentMethod.id);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe || loading}>
        {loading ? "Processing..." : "Add Payment Method"}
      </button>
    </form>
  );
};

export default PaymentMethodForm;
