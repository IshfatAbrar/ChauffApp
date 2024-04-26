"use client";
import React, { useContext, useEffect, useState } from "react";
import Autocomplete from "./Autocomplete";
import { SourceContext } from "@/context/SourceContext";
import { DestinationContext } from "@/context/DestinationContext";
import DateSelecter from "./DateSelecter";
import CarListOptions from "./CarListOptions";
import { TimeContext } from "@/context/TimeContext";

function Booking() {
  const { source, setSource } = useContext(SourceContext);
  const { destination, setDestination } = useContext(DestinationContext);
  const { time, setTime } = useContext(TimeContext);
  const [distance, setDistance] = useState();
  const calculateDistance = () => {
    console.log();
    const dist = google.maps.geometry.spherical.computeDistanceBetween(
      { lat: parseFloat(source.lat), lng: parseFloat(source.lng) },
      { lat: parseFloat(destination.lat), lng: parseFloat(destination.lng) }
    );

    console.log(dist * 0.000621374);
    setDistance(dist * 0.000621374);
  };

  useEffect(() => {
    if (!source) {
      setDistance(0);
    }
    if (destination) {
      setDistance(0);
    }
  }, [source, destination]);

  return (
    <div className="flex flex-col p-5">
      <div className="flex flex-col rounded-md p-4 w-full">
        <h2 className="text-[20px] font-semibold">Booking</h2>
        <div className="flex flex-col gap-3 mt-5 ">
          <Autocomplete type="source" />
          <Autocomplete type="dropoff" />
          <DateSelecter />

          <button
            className={`p-4 bg-slate-900 w-full mt-5 text-white rounded-lg ${
              !source || !destination || !time
                ? "opacity-85 cursor-not-allowed"
                : ""
            }`}
            onClick={() => calculateDistance()}
            disabled={!source || !destination || !time}
          >
            Search
          </button>
        </div>
      </div>
      {distance ? <CarListOptions distance={distance} /> : null}
    </div>
  );
}

export default Booking;
