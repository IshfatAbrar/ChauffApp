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
      // Re-fetch payment method for the detected region to avoid stale cross-region IDs
      const pmRes = await fetch("/api/get-payment-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          region: customerRegion || "US",
        }),
      });
      const pmData = await pmRes.json();
      const activePaymentMethod = pmData.paymentMethod;

      if (!activePaymentMethod?.id || !activePaymentMethod?.customer) {
        alert(
          "No payment method found for your region. Please add a card and try again.",
        );
        setIsSubmitting(false);
        return;
      }

      const activeCustomerId = activePaymentMethod.customer;

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
        stripeCustomerId: activeCustomerId,
        stripePaymentMethodId: activePaymentMethod.id,
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
          customerId: activeCustomerId,
          paymentMethodId: activePaymentMethod.id,
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
      <div className="h-full overflow-y-scroll no-scrollbar border border-white/10 bg-void p-5 pb-10 md:p-6">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
              Almost there
            </p>
            <h2 className="font-instrument text-[28px] font-normal leading-[1.15] tracking-[-0.02em] text-paper md:text-[32px]">
              Confirm Your Ride
            </h2>
          </div>
          <button
            onClick={handleCloseClick}
            className="rounded-full border border-white/15 bg-obsidian p-2 text-frost transition hover:text-paper"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        <form
          onSubmit={createBookingHandler}
          className="flex flex-col gap-4 font-body text-sm"
        >
          <div className="rounded-2xl border border-white/10 bg-obsidian p-4">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
              Your information
            </p>
            <div className="mb-3">
              <label className="mb-0.5 block text-xs text-ash">Name</label>
              <p className="text-paper">{name}</p>
            </div>
            <div className="mb-3">
              <label className="mb-0.5 block text-xs text-ash">Email</label>
              <p className="text-paper">{email}</p>
            </div>
            <div className="mb-3">
              <label
                htmlFor="phone"
                className="mb-1 block text-xs text-ash"
              >
                Phone Number
              </label>
              <input
                type="text"
                id="phone"
                value={phone || ""}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-graphite p-2.5 text-paper placeholder-ash focus:border-white/25 focus:outline-none"
                placeholder="Enter your phone number"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ash">
                Payment Method
              </label>
              <p className="text-paper">
                {paymentMethod.card.brand.charAt(0).toUpperCase() +
                  paymentMethod.card.brand.slice(1)}{" "}
                ····{paymentMethod?.card.last4}
              </p>
              <button
                type="button"
                className="mt-1 font-mono text-[11px] text-ash transition hover:text-frost"
                onClick={() => setIsPaymentModalOpen(true)}
              >
                Use another card?
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-obsidian p-4">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
              Additional instructions
            </p>
            <div className="mb-3">
              <label
                htmlFor="address"
                className="mb-1 block text-xs text-ash"
              >
                Detailed Address
              </label>
              <input
                type="text"
                id="address"
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-graphite p-2.5 text-paper placeholder-ash focus:border-white/25 focus:outline-none"
                placeholder="Apt, suite, floor, etc."
              />
            </div>
            <div>
              <label
                htmlFor="notes"
                className="mb-1 block text-xs text-ash"
              >
                Notes for driver
              </label>
              <input
                type="text"
                id="notes"
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-graphite p-2.5 text-paper placeholder-ash focus:border-white/25 focus:outline-none"
                placeholder="Any special instructions"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-obsidian p-4">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
              Pickup details
            </p>
            <div className="mb-3">
              <label className="mb-0.5 block text-xs text-ash">
                Date & Time
              </label>
              <p className="text-paper">{timeString}</p>
            </div>
            <div className="mb-3">
              <label className="mb-0.5 block text-xs text-ash">Vehicle</label>
              <p className="text-paper">{selectedCar}</p>
            </div>
            <div>
              <label className="mb-0.5 block text-xs text-ash">Total</label>
              <p className="font-body text-base text-paper">
                {formatCurrency(price, currency || "USD")}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !stripeCustomerId || !paymentMethod?.id}
            className={`w-full rounded-full py-3.5 font-body text-[15px] transition ${
              isSubmitting || !stripeCustomerId || !paymentMethod?.id
                ? "cursor-not-allowed bg-graphite text-ash"
                : "bg-paper text-black hover:opacity-85"
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
