"use client";
import React, { useContext, useEffect, useState, useRef } from "react";
import Autocomplete from "./Autocomplete";
import { SourceContext } from "../../context/SourceContext";
import { DestinationContext } from "../../context/DestinationContext";
import { StopoverContext } from "../../context/StopoverContext";
import DateSelecter from "./DateSelecter";
import CarListOptions from "./CarListOptions";
import { TimeContext } from "../../context/TimeContext";
import { DistanceContext } from "../../context/DistanceContext";
import { TollContext } from "../../context/TollContext";

function Booking({
  duration,
  setIsPaymentModalOpen,
  paymentMethod,
  customerRegion,
  currency,
}) {
  const { source, setSource } = useContext(SourceContext);
  const { destination, setDestination } = useContext(DestinationContext);
  const { stopover, setStopover } = useContext(StopoverContext);

  const { time, setTime } = useContext(TimeContext);
  const { distance, setDistance } = useContext(DistanceContext);
  const { toll, setToll } = useContext(TollContext);
  const [showDistance, setShowDistance] = useState(false);
  const [error, setError] = useState(false);
  const [max, setMax] = useState(false);

  const bottomRef = useRef(null); // Reference for scrolling to bottom

  useEffect(() => {
    if (!source) {
      setDistance(0);
    }
    if (destination) {
      setDistance(0);
    }
  }, [source, destination]);

  const panDowntoBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 200);
  };

  const onSearchHandler = () => {
    if (!stopover) {
      if (!source || !destination || !time || !distance) {
        setError(true);
        return;
      }
    } else {
      if (
        !source ||
        !destination ||
        !time ||
        !distance ||
        stopover.some((stop) => !stop)
      ) {
        setError(true);
        return;
      }
    }
    setShowDistance(!showDistance);
    setError(false);
    panDowntoBottom();
    // Scroll to bottom after a 1-second delay
  };

  const handleAddStopover = () => {
    if (stopover.length < 2) {
      setStopover((prevStopovers) => [
        ...prevStopovers,
        { lat: null, lng: null, name: "", label: "" },
      ]);
    }
  };

  useEffect(() => {
    if (stopover.length == 2) {
      setMax(true);
    } else {
      setMax(false);
    }
  }, [stopover]);

  const handleTrashClick = (index) => {
    setStopover((prevStopovers) => {
      return prevStopovers.filter((_, i) => i !== index);
    });
  };

  return (
    <div className="flex flex-col p-5 md:pt-10">
      <div className="flex flex-col p-4 w-full">
        <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-1">
          New booking
        </p>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Where are you headed?
        </h2>
        {error && (
          <p className="bg-red-50 text-red-700 border border-red-200 mt-2 mb-2 text-xs rounded-xl p-3">
            <i className="fa-solid fa-triangle-exclamation mr-1"></i>
            Please fill in all fields before searching.
          </p>
        )}
        <div className="flex flex-col gap-3">
          <Autocomplete type="source" />
          {stopover.map((stop, index) => (
            <Autocomplete
              key={index}
              type="stop"
              handleTrashClick={handleTrashClick}
              index={index}
            />
          ))}
          <Autocomplete type="dropoff" />
          <button
            onClick={handleAddStopover}
            className={`py-2 w-full rounded-full text-sm border transition ${
              max
                ? "text-slate-300 border-slate-100 cursor-not-allowed"
                : "text-slate-500 border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            + Add stopover
          </button>
          <DateSelecter />

          <button
            className="py-3 bg-slate-900 w-full mt-2 text-white text-sm font-semibold rounded-full shadow-md hover:bg-slate-800 transition"
            onClick={onSearchHandler}
          >
            Search
          </button>
        </div>
      </div>

      {!error && distance && showDistance ? (
        <div ref={bottomRef}>
          <CarListOptions
            duration={duration}
            distance={distance}
            panDowntoBottom={panDowntoBottom}
            setIsPaymentModalOpen={setIsPaymentModalOpen}
            paymentMethod={paymentMethod}
            customerRegion={customerRegion}
            currency={currency}
          />
        </div>
      ) : null}
    </div>
  );
}

export default Booking;
