import Image from "next/image";
import React, { useState } from "react";
import PriceBreakdownModal from "./PriceBreakdownModal";
import { formatCurrency } from "../../lib/utils/currency";

// Helper function to parse duration from Google Routes API format (e.g., "3600s" or {seconds: 3600})
const parseDurationToMinutes = (duration) => {
  if (!duration) return 0;

  // If it's a string like "3600s"
  if (typeof duration === "string") {
    const seconds = parseInt(duration.replace("s", ""), 10);
    return seconds / 60;
  }

  // If it's an object with seconds property
  if (typeof duration === "object" && duration.seconds) {
    return duration.seconds / 60;
  }

  // If it's already a number (seconds)
  if (typeof duration === "number") {
    return duration / 60;
  }

  return 0;
};

// Helper function to convert km to miles
const kmToMiles = (km) => {
  return km * 0.621371;
};

// Calculate price: base_fare + (per_minute × estimated_minutes) + (per_mile × estimated_miles) + tolls
const calculatePrice = (car, distanceKm, duration, toll) => {
  const baseFare = car.baseFare || 0;
  const perMinute = car.perMinute || 0;
  const perMile = car.perMile || 0;

  const minutes = parseDurationToMinutes(duration);
  const miles = kmToMiles(distanceKm || 0);
  const tollAmount = toll || 0;

  const price = baseFare + perMinute * minutes + perMile * miles + tollAmount;

  return Math.max(0, price); // Ensure price is not negative
};

function CarListItem({ car, distance, duration, toll, currency }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const estimatedPrice = calculatePrice(car, distance, duration, toll);

  return (
    <>
      <div className="py-3 px-4">
        <div className="flex flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-start">
            <h2 className="font-semibold text-base text-slate-900 flex gap-2 items-center">
              {car.name}
              <span className="text-xs font-normal text-slate-400">
                {car.seat}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{car.desc}</p>
            {toll && toll > 0 && (
              <p className="text-[10px] text-slate-400 mt-1">
                <i className="fa-solid fa-circle-info mr-1"></i>
                Tolls: {formatCurrency(toll, currency)}
              </p>
            )}
          </div>
          <span
            className="text-base font-semibold text-slate-900 cursor-pointer hover:text-slate-600 transition-colors whitespace-nowrap"
            onClick={() => setIsModalOpen(true)}
            title="Click to see price breakdown"
          >
            {formatCurrency(estimatedPrice, currency)}
          </span>
        </div>
      </div>

      <PriceBreakdownModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        car={car}
        distance={distance}
        duration={duration}
        toll={toll}
        currency={currency}
      />
    </>
  );
}

export default CarListItem;
