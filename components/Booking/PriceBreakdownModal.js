"use client";
import React from "react";
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

function PriceBreakdownModal({
  isOpen,
  onClose,
  car,
  distance,
  duration,
  toll,
  currency,
}) {
  if (!isOpen) return null;

  const baseFare = car?.baseFare || 0;
  const perMinute = car?.perMinute || 0;
  const perMile = car?.perMile || 0;

  const minutes = parseDurationToMinutes(duration);
  const miles = kmToMiles(distance || 0);
  const tollAmount = toll || 0;

  const timeCost = perMinute * minutes;
  const distanceCost = perMile * miles;
  const total = baseFare + timeCost + distanceCost + tollAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-obsidian">
        <button
          className="absolute right-4 top-3 z-10 text-ash transition-colors hover:text-paper"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
        <div className="p-6">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
            Fare details
          </p>
          <h2 className="mb-4 font-instrument text-[28px] font-normal tracking-[-0.02em] text-paper">
            Price Breakdown
          </h2>
          <div className="mb-4">
            <h3 className="mb-1 font-body text-lg text-paper">{car?.name}</h3>
            <p className="font-body text-sm text-frost">{car?.desc}</p>
          </div>

          <div className="space-y-3 border-t border-white/10 pt-4">
            <div className="flex items-center justify-between">
              <span className="font-body text-frost">Base Fare</span>
              <span className="font-body text-paper">
                {formatCurrency(baseFare, currency)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-body text-frost">Time</span>
                <p className="font-mono text-[11px] text-ash">
                  {minutes.toFixed(1)} min × {formatCurrency(perMinute, currency)}
                  /min
                </p>
              </div>
              <span className="font-body text-paper">
                {formatCurrency(timeCost, currency)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-body text-frost">Distance</span>
                <p className="font-mono text-[11px] text-ash">
                  {miles.toFixed(2)} mi × {formatCurrency(perMile, currency)}/mi
                </p>
              </div>
              <span className="font-body text-paper">
                {formatCurrency(distanceCost, currency)}
              </span>
            </div>

            {tollAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="font-body text-frost">Tolls</span>
                <span className="font-body text-paper">
                  {formatCurrency(tollAmount, currency)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-white/10 pt-3 font-body text-lg text-paper">
              <span>Total</span>
              <span>{formatCurrency(total, currency)}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full rounded-full bg-paper py-3 font-body text-[15px] text-black transition-opacity duration-200 hover:opacity-85"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default PriceBreakdownModal;
