"use client";
import React, { useState, useEffect, useContext } from "react";

import { useRouter } from "next/navigation";
import { TimeContext } from "../../context/TimeContext";
import { useSession } from "next-auth/react";
import { getPhone } from "../../lib/actions/booking.actions";
import { createBooking } from "../../lib/actions/booking.actions";
import { updateBookingPaymentIntent } from "../../lib/actions/booking.actions";
import { deleteBooking } from "../../lib/actions/booking.actions";
import { formatCurrency } from "../../lib/utils/currency";

import { SourceContext } from "../../context/SourceContext";
import { DestinationContext } from "../../context/DestinationContext";
import { StopoverContext } from "../../context/StopoverContext";
import { TollContext } from "../../context/TollContext";

import { CSSTransition } from "react-transition-group";
import "./ConfirmationForm.css";

function ConfirmationForm({
  selectedCar,
  distance,
  duration,
  price,
  setConfirm,
  paymentMethod,
  setIsPaymentModalOpen,
  customerRegion,
  currency,
}) {
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { time, setTime } = useContext(TimeContext);
  const { data: session } = useSession();
  const name = session?.user?.name;
  const email = session?.user?.email;
  const { source, setSource } = useContext(SourceContext);
  const { destination, setDestination } = useContext(DestinationContext);
  const { stopover, setStopover } = useContext(StopoverContext);
  const { toll } = useContext(TollContext);

  const timeString = time?.toString() ?? "";

  // Use the customer ID from the payment method object to guarantee they match.
  // Fetching the customer ID separately via /api/get-customer-id can return a
  // different customer record (duplicate emails in Stripe), causing the
  // "No such PaymentMethod" error when creating the payment intent.
  const stripeCustomerId = paymentMethod?.customer ?? "";

  useEffect(() => {
    const fetchPhone = async () => {
      try {
        const userPhone = await getPhone(email);
        setPhone(userPhone ? String(userPhone) : "");
      } catch (error) {
        console.error("Error fetching phone number:", error);
      }
    };

    if (email) {
      fetchPhone();
    }
  }, [email]);

  const handleCloseClick = () => {
    setConfirm(false); // Hide the ConfirmationForm
  };

  const createBookingHandler = async (e) => {
    e.preventDefault();

    if (!stripeCustomerId || !paymentMethod?.id) {
      alert("Payment information is missing. Please refresh and try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Create booking first (server assigns chauffeur/fleet)
      const bookingDetails = {
        detailedLocation: address,
        phoneNumber: phone,
        notes: notes,
        time: time.toString(),
        selectedCar: selectedCar,
        duration: duration,
        distance: distance,
        toll: toll || 0,
        price: price,
        pickupLocation: source,
        location: {
          type: "Point",
          coordinates: [source.lng, source.lat],
        },
        dropoffLocation: destination,
        stopoverLocation: stopover,
        status: "requested",
        customerRegion: customerRegion || "US", // Customer's region
        currency: currency || "USD", // Customer's currency
        stripeCustomerId: stripeCustomerId,
        stripePaymentMethodId: paymentMethod?.id,
        payment: {
          status: "pending",
        },
      };

      const newBooking = await createBooking(email, bookingDetails);
      console.log("Booking created:", newBooking);
      if (!newBooking?._id) {
        throw new Error("Failed to create booking");
      }

      // Step 2: Create payment authorization hold as a destination charge to Fleet
      console.log(
        `Creating payment authorization hold for ${currency} ${price} in region ${customerRegion}`,
      );
      const paymentResponse = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: price,
          currency: currency?.toLowerCase() || "usd",
          customerId: stripeCustomerId,
          paymentMethodId: paymentMethod.id,
          bookingId: newBooking._id,
          customerRegion: customerRegion || "US",
          metadata: {
            selectedCar: selectedCar,
            pickupLocation: source.name,
            dropoffLocation: destination.name,
          },
        }),
      });

      const paymentData = await paymentResponse.json();

      if (!paymentData.success) {
        // Roll back booking if authorization fails
        try {
          await deleteBooking(newBooking._id);
        } catch (e) {}

        if (paymentData.requiresAction) {
          alert(
            "Your card requires additional authentication. Please use a different card or contact your bank.",
          );
        } else {
          alert(
            `Payment authorization failed: ${paymentData.error || "Unknown error"}`,
          );
        }
        setIsSubmitting(false);
        return;
      }

      console.log(
        "Payment authorization successful:",
        paymentData.paymentIntentId,
      );

      // Step 3: Update booking with payment intent ID
      await updateBookingPaymentIntent(
        newBooking._id,
        paymentData.paymentIntentId,
      );

      if (newBooking) {
        const form = e.target;
        form.reset();
        alert(
          `Booking confirmed! ${formatCurrency(
            price,
            currency || "USD",
          )} has been authorized on your card and will be charged when the ride is completed.`,
        );
        router.push("/trips");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("There was an error creating your booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CSSTransition
      in={confirm}
      timeout={300}
      classNames="confirmation-form"
      unmountOnExit
    >
      <div
        className="bg-white p-4 pb-10 overflow-y-scroll no-scrollbar border-r border-slate-200"
        style={{ height: window.innerHeight }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pt-24 mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-0.5">
              Almost there
            </p>
            <h2 className="text-xl font-semibold text-slate-900">
              Confirm Your Ride
            </h2>
          </div>
          <button
            onClick={handleCloseClick}
            className="p-2 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 transition shadow-sm"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        <form
          onSubmit={createBookingHandler}
          className="flex flex-col gap-4 text-sm"
        >
          {/* Your Information */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-3">
              Your information
            </p>
            <div className="mb-3">
              <label className="text-xs text-slate-500 mb-0.5 block">
                Name
              </label>
              <p className="text-slate-900 font-medium">{name}</p>
            </div>
            <div className="mb-3">
              <label className="text-xs text-slate-500 mb-0.5 block">
                Email
              </label>
              <p className="text-slate-900 font-medium">{email}</p>
            </div>
            <div className="mb-3">
              <label
                htmlFor="phone"
                className="text-xs text-slate-500 mb-1 block"
              >
                Phone Number
              </label>
              <input
                type="text"
                id="phone"
                value={phone || ""}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-300 bg-[#f8f8f8] focus:outline-none focus:ring-1 focus:ring-slate-400"
                placeholder="Enter your phone number"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Payment Method
              </label>
              <p className="text-slate-900 font-medium">
                {paymentMethod.card.brand.charAt(0).toUpperCase() +
                  paymentMethod.card.brand.slice(1)}{" "}
                ····{paymentMethod?.card.last4}
              </p>
              <button
                type="button"
                className="text-[11px] text-slate-400 hover:text-slate-600 mt-1 transition"
                onClick={() => setIsPaymentModalOpen(true)}
              >
                Use another card?
              </button>
            </div>
          </div>

          {/* Additional Instructions */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-3">
              Additional instructions
            </p>
            <div className="mb-3">
              <label
                htmlFor="address"
                className="text-xs text-slate-500 mb-1 block"
              >
                Detailed Address
              </label>
              <input
                type="text"
                id="address"
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-300 bg-[#f8f8f8] focus:outline-none focus:ring-1 focus:ring-slate-400"
                placeholder="Apt, suite, floor, etc."
              />
            </div>
            <div>
              <label
                htmlFor="notes"
                className="text-xs text-slate-500 mb-1 block"
              >
                Notes for driver
              </label>
              <input
                type="text"
                id="notes"
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-300 bg-[#f8f8f8] focus:outline-none focus:ring-1 focus:ring-slate-400"
                placeholder="Any special instructions"
              />
            </div>
          </div>

          {/* Pickup Details */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-3">
              Pickup details
            </p>
            <div className="mb-3">
              <label className="text-xs text-slate-500 mb-0.5 block">
                Date & Time
              </label>
              <p className="text-slate-900 font-medium">{timeString}</p>
            </div>
            <div className="mb-3">
              <label className="text-xs text-slate-500 mb-0.5 block">
                Vehicle
              </label>
              <p className="text-slate-900 font-medium">{selectedCar}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-0.5 block">
                Total
              </label>
              <p className="text-slate-900 font-semibold text-base">
                {formatCurrency(price, currency || "USD")}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !stripeCustomerId || !paymentMethod?.id}
            className={`w-full py-3 rounded-full text-white text-sm font-semibold shadow-md transition ${
              isSubmitting || !stripeCustomerId || !paymentMethod?.id
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-slate-900 hover:bg-slate-800"
            }`}
          >
            {isSubmitting ? "Processing..." : "Confirm Ride"}
          </button>
        </form>
      </div>
    </CSSTransition>
  );
}

export default ConfirmationForm;
