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

const hasPlace = (place) =>
  place &&
  typeof place.lat === "number" &&
  typeof place.lng === "number" &&
  Number.isFinite(place.lat) &&
  Number.isFinite(place.lng);

function Booking({
  duration,
  setIsPaymentModalOpen,
  paymentMethod,
  customerRegion,
  currency,
}) {
  const { source } = useContext(SourceContext);
  const { destination } = useContext(DestinationContext);
  const { stopover, setStopover } = useContext(StopoverContext);

  const { time } = useContext(TimeContext);
  const { distance, setDistance } = useContext(DistanceContext);
  const [showDistance, setShowDistance] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    "Please fill in all fields before searching."
  );
  const [max, setMax] = useState(false);
  const [searching, setSearching] = useState(false);
  const pendingSearch = useRef(false);

  const bottomRef = useRef(null);

  useEffect(() => {
    // Reset results whenever the trip shape changes
    setShowDistance(false);
    pendingSearch.current = false;
    setSearching(false);
    if (!hasPlace(source) || !hasPlace(destination)) {
      setDistance(0);
    }
  }, [source, destination, stopover, setDistance]);

  const panDowntoBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 200);
  };

  // If the user tapped Search before the route finished, finish once distance arrives
  useEffect(() => {
    if (!pendingSearch.current || !(distance > 0)) return;
    pendingSearch.current = false;
    setSearching(false);
    setShowDistance(true);
    setError(false);
    panDowntoBottom();
  }, [distance]);

  // Don't leave the button stuck on "Calculating…" if the route API fails
  useEffect(() => {
    if (!searching) return undefined;
    const timer = setTimeout(() => {
      if (!pendingSearch.current) return;
      pendingSearch.current = false;
      setSearching(false);
      setErrorMessage(
        "Couldn't calculate that route. Check your locations and try again."
      );
      setError(true);
    }, 12000);
    return () => clearTimeout(timer);
  }, [searching]);

  const onSearchHandler = () => {
    const incompleteStop = Array.isArray(stopover)
      ? stopover.some((stop) => !hasPlace(stop))
      : false;

    if (!hasPlace(source) || !hasPlace(destination)) {
      pendingSearch.current = false;
      setSearching(false);
      setErrorMessage("Select a pickup and dropoff location.");
      setError(true);
      return;
    }
    if (!time) {
      pendingSearch.current = false;
      setSearching(false);
      setErrorMessage("Choose a pickup time at least 6 hours from now.");
      setError(true);
      return;
    }
    if (incompleteStop) {
      pendingSearch.current = false;
      setSearching(false);
      setErrorMessage("Finish or remove any incomplete stopovers.");
      setError(true);
      return;
    }
    if (!distance || distance <= 0) {
      pendingSearch.current = true;
      setSearching(true);
      setErrorMessage("Calculating your route…");
      setError(true);
      return;
    }

    pendingSearch.current = false;
    setSearching(false);
    setShowDistance(true);
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
    setMax(stopover.length === 2);
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
            {errorMessage}
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
            type="button"
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
            type="button"
            className="relative z-10 mt-2 w-full touch-manipulation rounded-full bg-paper py-3.5 font-body text-[15px] text-black transition-opacity duration-200 hover:opacity-85 disabled:opacity-70"
            onClick={onSearchHandler}
            disabled={searching}
          >
            {searching ? "Calculating…" : "Search"}
          </button>
        </div>
      </div>

      {!error && distance > 0 && showDistance ? (
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
