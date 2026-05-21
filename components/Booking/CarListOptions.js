import { CarListData } from "../../util/CarListData";
import React, { useState, useContext } from "react";
import CarListItem from "./CarListItem";
import { TollContext } from "../../context/TollContext";

import ConfirmationForm from "./ConfirmationForm";

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

function CarListOptions({
  distance,
  duration,
  panDowntoBottom,
  setIsPaymentModalOpen,
  paymentMethod,
  customerRegion,
  currency,
}) {
  const [activeIndex, setActiveIndex] = useState();
  const [selectedCar, setSelectedCar] = useState([]);
  const [price, setPrice] = useState();
  const [confirm, setConfirm] = useState(false);
  const { toll } = useContext(TollContext);

  return (
    <div className="mt-5 px-4">
      <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-3">
        Recommended
      </p>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden divide-y divide-slate-100">
        {CarListData.map((item, index) => (
          <div
            key={index}
            className={`cursor-pointer transition-colors ${
              activeIndex == index ? "bg-slate-50" : "hover:bg-slate-50"
            }`}
            onClick={() => {
              setActiveIndex(index);
              setSelectedCar(item);
              panDowntoBottom();
            }}
          >
            <CarListItem
              car={item}
              distance={distance}
              duration={duration}
              toll={toll}
              currency={currency}
            />
          </div>
        ))}
      </div>
      {selectedCar?.name && paymentMethod ? (
        <button
          className="z-10 flex md:fixed mt-4 bottom-5 right-5 md:left-5 md:right-auto
            shadow-lg px-6 py-3 bg-slate-900 text-white text-sm font-semibold
            rounded-full hover:bg-slate-800 transition"
          onClick={() => {
            const calculatedPrice = calculatePrice(
              selectedCar,
              distance,
              duration,
              toll,
            );
            setPrice(calculatedPrice.toFixed(2));
            setConfirm(true);
          }}
        >
          Request {selectedCar.name}
        </button>
      ) : selectedCar?.name ? (
        <button
          className="z-10 flex md:fixed mt-4 bottom-5 right-5 md:left-5 md:right-auto
            shadow-lg px-6 py-3 bg-slate-900 text-white text-sm font-semibold
            rounded-full hover:bg-slate-800 transition"
          onClick={() => {
            setIsPaymentModalOpen(true);
          }}
        >
          Add Payment Method
        </button>
      ) : null}
      {price && confirm && (
        <div className="z-20 fixed left-0 top-0 w-full md:w-1/3">
          <ConfirmationForm
            duration={duration}
            price={price}
            selectedCar={selectedCar.name}
            distance={distance}
            setConfirm={setConfirm}
            paymentMethod={paymentMethod}
            setIsPaymentModalOpen={setIsPaymentModalOpen}
            customerRegion={customerRegion}
            currency={currency}
          />
        </div>
      )}
    </div>
  );
}

export default CarListOptions;
