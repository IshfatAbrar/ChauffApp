"use client";
import React from "react";
import { formatCurrency } from "../../lib/utils/currency";

// Helper function to parse duration from Google Routes API format
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

// Helper function to convert km to miles
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full relative">
        <button
          className="absolute top-2 right-4 text-gray-600 hover:text-gray-800 z-10 text-2xl"
          onClick={onClose}
        >
          ✕
        </button>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Price Breakdown</h2>
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">{car?.name}</h3>
            <p className="text-sm text-gray-600">{car?.desc}</p>
          </div>
          
          <div className="space-y-3 border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Base Fare</span>
              <span className="font-semibold">
                {formatCurrency(baseFare, currency)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-700">Time</span>
                <p className="text-xs text-gray-500">
                  {minutes.toFixed(1)} min × {formatCurrency(perMinute, currency)}
                  /min
                </p>
              </div>
              <span className="font-semibold">
                {formatCurrency(timeCost, currency)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-700">Distance</span>
                <p className="text-xs text-gray-500">
                  {miles.toFixed(2)} mi × {formatCurrency(perMile, currency)}/mi
                </p>
              </div>
              <span className="font-semibold">
                {formatCurrency(distanceCost, currency)}
              </span>
            </div>
            
            {tollAmount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Tolls</span>
                <span className="font-semibold">
                  {formatCurrency(tollAmount, currency)}
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-3 border-t border-gray-300 font-bold text-lg">
              <span>Total</span>
              <span>{formatCurrency(total, currency)}</span>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-full mt-6 py-2 px-4 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default PriceBreakdownModal;



