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

  const bottomRef = useRef(null);

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
    <div className="flex flex-col p-5 md:p-6">
      <div className="flex w-full flex-col">
        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
          New booking
        </p>
        <h2 className="mb-5 font-instrument text-[32px] font-normal leading-[1.1] tracking-[-0.02em] text-paper md:text-[36px]">
          Where are you headed?
        </h2>
        {error && (
          <p className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 font-body text-xs text-red-300">
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
            disabled={max}
            className={`w-full rounded-full border py-2.5 font-body text-sm transition ${
              max
                ? "cursor-not-allowed border-white/5 text-ash/40"
                : "border-white/15 text-frost hover:border-white/30 hover:text-paper"
            }`}
          >
            + Add stopover
          </button>
          <DateSelecter />

          <button
            className="mt-2 w-full rounded-full bg-paper py-3.5 font-body text-[15px] text-black transition-opacity duration-200 hover:opacity-85"
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
