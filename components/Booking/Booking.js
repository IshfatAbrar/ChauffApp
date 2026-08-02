"use client";

import React, { useContext, useEffect, useMemo, useState, useRef } from "react";
import Autocomplete from "./Autocomplete";
import { SourceContext } from "../../context/SourceContext";
import { DestinationContext } from "../../context/DestinationContext";
import { StopoverContext } from "../../context/StopoverContext";
import DateSelecter from "./DateSelecter";
import CarListOptions from "./CarListOptions";
import { TimeContext } from "../../context/TimeContext";
import { DistanceContext } from "../../context/DistanceContext";
import { TollContext } from "../../context/TollContext";
import { computeRoute, hasPlace } from "../../lib/computeRoute";

function tripFingerprint(source, destination, stopover, time) {
  const stopKey = (Array.isArray(stopover) ? stopover : [])
    .map((s) => `${s?.lat ?? ""},${s?.lng ?? ""}`)
    .join("|");
  return [
    source?.lat ?? "",
    source?.lng ?? "",
    destination?.lat ?? "",
    destination?.lng ?? "",
    stopKey,
    time instanceof Date ? time.getTime() : "",
  ].join("::");
}

function Booking({
  setDuration,
  setIsPaymentModalOpen,
  paymentMethod,
  customerRegion,
  currency,
}) {
  const { source } = useContext(SourceContext);
  const { destination } = useContext(DestinationContext);
  const { stopover, setStopover } = useContext(StopoverContext);
  const { time } = useContext(TimeContext);
  const { setDistance } = useContext(DistanceContext);
  const { setToll } = useContext(TollContext);

  const [showResults, setShowResults] = useState(false);
  const [routeDistance, setRouteDistance] = useState(0);
  const [routeDuration, setRouteDuration] = useState(null);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    "Please fill in all fields before searching."
  );
  const [max, setMax] = useState(false);
  const [searching, setSearching] = useState(false);
  const bottomRef = useRef(null);
  const searchId = useRef(0);
  const lastTripKey = useRef("");

  const tripKey = useMemo(
    () => tripFingerprint(source, destination, stopover, time),
    [source, destination, stopover, time]
  );

  // Only clear results when the trip inputs actually change
  useEffect(() => {
    if (lastTripKey.current && lastTripKey.current !== tripKey) {
      setShowResults(false);
      setRouteDistance(0);
      setRouteDuration(null);
      setError(false);
    }
    lastTripKey.current = tripKey;
  }, [tripKey]);

  useEffect(() => {
    setMax(stopover.length === 2);
  }, [stopover]);

  const panDowntoBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 250);
  };

  const onSearchHandler = async (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (searching) return;

    if (!hasPlace(source) || !hasPlace(destination)) {
      setErrorMessage(
        "Select a pickup and dropoff from the suggestions (tap a result)."
      );
      setError(true);
      setShowResults(false);
      return;
    }
    if (!time) {
      setErrorMessage("Choose a pickup time at least 6 hours from now.");
      setError(true);
      setShowResults(false);
      return;
    }
    if (time.getTime() < Date.now() + 6 * 60 * 60 * 1000) {
      setErrorMessage("Pickup time must be at least 6 hours from now.");
      setError(true);
      setShowResults(false);
      return;
    }
    if (Array.isArray(stopover) && stopover.some((stop) => !hasPlace(stop))) {
      setErrorMessage("Finish or remove any incomplete stopovers.");
      setError(true);
      setShowResults(false);
      return;
    }

    const id = ++searchId.current;
    setSearching(true);
    setError(false);

    try {
      const result = await computeRoute(source, destination, stopover);
      if (id !== searchId.current) return;

      const distanceKm = Number(result.distanceKm) || 0;
      if (distanceKm <= 0) {
        throw new Error("No driving route found between those locations.");
      }

      setRouteDistance(distanceKm);
      setRouteDuration(result.duration || null);
      setDistance(distanceKm);
      setToll(Number(result.toll) || 0);
      if (typeof setDuration === "function") {
        setDuration(result.duration);
      }
      setShowResults(true);
      setError(false);
      panDowntoBottom();
    } catch (err) {
      if (id !== searchId.current) return;
      setRouteDistance(0);
      setRouteDuration(null);
      setDistance(0);
      setToll(0);
      setShowResults(false);
      setErrorMessage(
        err?.message ||
          "Couldn't calculate that route. Check your locations and try again."
      );
      setError(true);
    } finally {
      if (id === searchId.current) {
        setSearching(false);
      }
    }
  };

  const handleAddStopover = () => {
    if (stopover.length < 2) {
      setStopover((prevStopovers) => [
        ...prevStopovers,
        { lat: null, lng: null, name: "", label: "" },
      ]);
    }
  };

  const handleTrashClick = (index) => {
    setStopover((prevStopovers) =>
      prevStopovers.filter((_, i) => i !== index)
    );
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
            <i className="fa-solid fa-triangle-exclamation mr-1" />
            {errorMessage}
          </p>
        )}
        <div className="flex flex-col gap-3">
          <Autocomplete type="source" />
          {stopover.map((_, index) => (
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
            className={`w-full touch-manipulation rounded-full border py-2.5 font-body text-sm transition ${
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
            className="relative z-[20] mt-2 min-h-[48px] w-full touch-manipulation rounded-full bg-paper py-3.5 font-body text-[15px] text-black transition-opacity duration-200 hover:opacity-85 disabled:opacity-70"
            onClick={onSearchHandler}
            disabled={searching}
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </div>
      </div>

      {showResults && routeDistance > 0 ? (
        <div ref={bottomRef} className="mt-2">
          <CarListOptions
            duration={routeDuration}
            distance={routeDistance}
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
