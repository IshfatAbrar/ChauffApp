import React, { useState } from "react";
import PriceBreakdownModal from "./PriceBreakdownModal";
import { formatCurrency } from "../../lib/utils/currency";

const parseDurationToMinutes = (duration) => {
  if (!duration) return 0;

  if (typeof duration === "string") {
    const seconds = parseInt(duration.replace("s", ""), 10);
    return seconds / 60;
  }

  if (typeof duration === "object" && duration.seconds) {
    return duration.seconds / 60;
  }

  if (typeof duration === "number") {
    return duration / 60;
  }

  return 0;
};

const kmToMiles = (km) => {
  return km * 0.621371;
};

const calculatePrice = (car, distanceKm, duration, toll) => {
  const baseFare = car.baseFare || 0;
  const perMinute = car.perMinute || 0;
  const perMile = car.perMile || 0;

  const minutes = parseDurationToMinutes(duration);
  const miles = kmToMiles(distanceKm || 0);
  const tollAmount = toll || 0;

  const price = baseFare + perMinute * minutes + perMile * miles + tollAmount;

  return Math.max(0, price);
};

function CarListItem({ car, distance, duration, toll, currency }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const estimatedPrice = calculatePrice(car, distance, duration, toll);

  return (
    <>
      <div className="px-4 py-3.5">
        <div className="flex flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-start">
            <h2 className="flex items-center gap-2 font-body text-base text-paper">
              {car.name}
              <span className="font-mono text-[11px] font-normal text-ash">
                {car.seat}
              </span>
            </h2>
            <p className="mt-0.5 font-body text-xs text-frost">{car.desc}</p>
            {toll && toll > 0 && (
              <p className="mt-1 font-mono text-[10px] text-ash">
                <i className="fa-solid fa-circle-info mr-1"></i>
                Tolls: {formatCurrency(toll, currency)}
              </p>
            )}
          </div>
          <span
            className="cursor-pointer whitespace-nowrap font-body text-base text-paper transition-colors hover:text-frost"
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
