import { CarListData } from "../../util/CarListData";
import React, { useState, useContext } from "react";
import CarListItem from "./CarListItem";
import { TollContext } from "../../context/TollContext";

import ConfirmationForm from "./ConfirmationForm";

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
    <div className="mt-6">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
        Recommended
      </p>
      <div className="overflow-hidden divide-y divide-white/10 rounded-2xl border border-white/10 bg-graphite">
        {CarListData.map((item, index) => (
          <div
            key={index}
            className={`cursor-pointer transition-colors ${
              activeIndex == index
                ? "bg-white/10"
                : "hover:bg-white/[0.04]"
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
          type="button"
          className="relative z-[20] mt-4 flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-full bg-paper px-6 py-3.5 font-body text-[15px] text-black transition-opacity duration-200 hover:opacity-85"
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
          type="button"
          className="relative z-[20] mt-4 flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-full bg-paper px-6 py-3.5 font-body text-[15px] text-black transition-opacity hover:opacity-85"
          onClick={() => {
            setIsPaymentModalOpen(true);
          }}
        >
          Add Payment Method
        </button>
      ) : null}
      {price && confirm && (
        <div className="fixed inset-x-3 top-[4.75rem] bottom-3 z-40 overflow-hidden rounded-[24px] md:inset-x-auto md:left-4 md:w-[calc((100%-2rem)/3)]">
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
