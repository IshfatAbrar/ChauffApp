/**
 * DRIVER APP - Complete Ride Component Example
 *
 * This is an example of how to integrate the payment capture
 * functionality in your driver app when completing a ride.
 */

import React, { useState } from "react";

function CompleteRideComponent({ booking }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [actualFare, setActualFare] = useState(booking.price); // Start with estimated price
  const [error, setError] = useState(null);

  // Calculate actual fare based on time and distance
  const calculateActualFare = () => {
    // Your fare calculation logic here
    // This might include:
    // - Base fare
    // - Per mile/km charges
    // - Per minute charges
    // - Wait time charges
    // - Tolls
    // - Surcharges

    // Example:
    const baseFare = 5.0;
    const perMile = 2.5;
    const perMinute = 0.35;
    const actualDistance = 10.5; // miles driven
    const actualTime = 25; // minutes

    const calculated =
      baseFare + actualDistance * perMile + actualTime * perMinute;
    setActualFare(calculated);
  };

  const completeRide = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Capture the payment and trigger fleet transfer
      console.log("Capturing payment for booking:", booking._id);

      const paymentResponse = await fetch("/api/capture-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId: booking.payment.paymentIntentId,
          finalAmount: actualFare,
          bookingId: booking._id,
        }),
      });

      const paymentData = await paymentResponse.json();

      if (!paymentData.success) {
        throw new Error(paymentData.error || "Payment capture failed");
      }

      console.log("Payment captured and transfer processed:", paymentData);

      // Step 2: Update ride status in your backend
      // (This would be a separate API call to update the booking status)
      const statusResponse = await fetch("/api/bookings/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking._id,
          status: "completed",
          completedAt: new Date().toISOString(),
          actualFare: actualFare,
        }),
      });

      if (statusResponse.ok) {
        alert(
          `Ride completed! $${paymentData.amountCaptured} charged. Fleet payout: $${paymentData.fleetAmount}.`
        );
        // Navigate to completed rides screen or earnings page
      }
    } catch (error) {
      console.error("Error completing ride:", error);
      setError(error.message);
      alert(`Failed to complete ride: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelRide = async (reason) => {
    if (!confirm("Are you sure you want to cancel this ride?")) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/cancel-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId: booking.payment.paymentIntentId,
          bookingId: booking._id,
          cancelReason: reason,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Cancellation failed");
      }

      alert("Ride cancelled. Payment hold released.");
      // Navigate back or refresh
    } catch (error) {
      console.error("Error cancelling ride:", error);
      setError(error.message);
      alert(`Failed to cancel ride: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md">
      <h2 className="text-2xl font-bold mb-4">Complete Ride</h2>

      {/* Ride Details */}
      <div className="mb-6">
        <div className="mb-2">
          <span className="font-semibold">Customer:</span> {booking.email}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Car:</span> {booking.selectedCar}
        </div>
        <div className="mb-2">
          <span className="font-semibold">From:</span>{" "}
          {booking.pickupLocation.name}
        </div>
        <div className="mb-2">
          <span className="font-semibold">To:</span>{" "}
          {booking.dropoffLocation.name}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Estimated:</span> $
          {booking.price.toFixed(2)}
        </div>
      </div>

      {/* Fare Adjustment */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <label className="block font-semibold mb-2">
          Actual Fare (can adjust based on final time/distance)
        </label>
        <div className="flex gap-2 items-center">
          <span className="text-2xl font-bold text-green-600">
            ${actualFare.toFixed(2)}
          </span>
          <button
            onClick={calculateActualFare}
            className="text-sm text-blue-600 underline"
          >
            Recalculate
          </button>
        </div>
        <input
          type="number"
          step="0.01"
          value={actualFare}
          onChange={(e) => setActualFare(parseFloat(e.target.value))}
          className="mt-2 w-full border rounded p-2"
          disabled={isProcessing}
        />
        {actualFare > booking.price && (
          <p className="mt-2 text-sm text-amber-600">
            ⚠️ Warning: Actual fare exceeds authorized amount. Maximum
            chargeable: ${booking.price.toFixed(2)}
          </p>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={completeRide}
          disabled={isProcessing || actualFare > booking.price}
          className={`w-full py-3 px-4 rounded-lg text-white font-medium ${
            isProcessing || actualFare > booking.price
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isProcessing
            ? "Processing..."
            : `Complete Ride & Charge $${actualFare.toFixed(2)}`}
        </button>

        <button
          onClick={() => cancelRide("Driver cancelled")}
          disabled={isProcessing}
          className="w-full py-3 px-4 rounded-lg bg-white border-2 border-red-500 text-red-500 font-medium hover:bg-red-50 disabled:opacity-50"
        >
          Cancel Ride
        </button>
      </div>

      {/* Payment Info */}
      <div className="mt-6 p-3 bg-blue-50 rounded text-sm">
        <p className="font-semibold mb-1">💡 Payment Info:</p>
        <p className="text-gray-600">
          ${booking.price.toFixed(2)} was authorized on customer's card. You can
          charge up to this amount. Any unused authorization will be released
          automatically.
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Payment Intent ID: {booking.payment.paymentIntentId}
        </p>
      </div>
    </div>
  );
}

export default CompleteRideComponent;

/**
 * USAGE EXAMPLE IN DRIVER APP:
 *
 * import CompleteRideComponent from './CompleteRideComponent';
 *
 * function DriverDashboard() {
 *   const [currentRide, setCurrentRide] = useState(null);
 *
 *   // Load current active ride from your backend
 *   useEffect(() => {
 *     async function loadActiveRide() {
 *       const response = await fetch('/api/driver/active-ride');
 *       const data = await response.json();
 *       setCurrentRide(data.booking);
 *     }
 *     loadActiveRide();
 *   }, []);
 *
 *   if (!currentRide) {
 *     return <div>No active rides</div>;
 *   }
 *
 *   return <CompleteRideComponent booking={currentRide} />;
 * }
 */


