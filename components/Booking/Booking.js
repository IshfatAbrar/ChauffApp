"use client";
import React, { useContext, useEffect, useState } from "react";
import Autocomplete from "./Autocomplete";
import { SourceContext } from "@/context/SourceContext";
import { DestinationContext } from "@/context/DestinationContext";
import { StopoverContext } from "@/context/StopoverContext";
import DateSelecter from "./DateSelecter";
import CarListOptions from "./CarListOptions";
import { TimeContext } from "@/context/TimeContext";
import { IsStopoverContext } from "@/context/IsStopover";
import TollCalculator from "../Map/TollCalculator";
import OneStopTollCalculator from "../Map/OneStopTollCalculator";
import { DistanceContext } from "@/context/DistanceContext";

function Booking() {
  const { source, setSource } = useContext(SourceContext);
  const { destination, setDestination } = useContext(DestinationContext);
  const { stopover, setStopover } = useContext(StopoverContext);
  const { isStopover, setIsStopover } = useContext(IsStopoverContext);
  const { time, setTime } = useContext(TimeContext);
  const { distance, setDistance } = useContext(DistanceContext);
  const [showDistance, setShowDistance] = useState(false);

  // const calculateDistance = () => {
  //   if (isStopover === true) {
  //     const dist_1 = google.maps.geometry.spherical.computeDistanceBetween(
  //       { lat: parseFloat(source.lat), lng: parseFloat(source.lng) },
  //       { lat: parseFloat(stopover.lat), lng: parseFloat(stopover.lng) }
  //     );

  //     const dist_2 = google.maps.geometry.spherical.computeDistanceBetween(
  //       { lat: parseFloat(stopover.lat), lng: parseFloat(stopover.lng) },
  //       { lat: parseFloat(destination.lat), lng: parseFloat(destination.lng) }
  //     );

  //     console.log((dist_1 + dist_2) * 0.00097891362);
  //     setDistance((dist_1 + dist_2) * 0.00097891362);
  //   } else {
  //     const dist = google.maps.geometry.spherical.computeDistanceBetween(
  //       { lat: parseFloat(source.lat), lng: parseFloat(source.lng) },
  //       { lat: parseFloat(destination.lat), lng: parseFloat(destination.lng) }
  //     );

  //     console.log(dist / 1000);
  //     setDistance(dist / 1000);
  //   }
  // };

  console.log(distance);

  useEffect(() => {
    if (!source) {
      setDistance(0);
    }
    if (destination) {
      setDistance(0);
    }
  }, [source, destination]);

  useEffect(() => {
    if (isStopover) {
      if (stopover.length == []) {
        setDistance(0);
      }
    }
  }, [isStopover]);

  return (
    <div className="flex flex-col p-5 md:pt-12">
      <div className="flex flex-col rounded-md p-4 w-full">
        <h2 className="text-[20px] font-semibold">Booking</h2>
        <div className="flex flex-col gap-2 mt-4 ">
          <Autocomplete type="source" />
          {isStopover ? <Autocomplete type="stop" /> : <></>}
          <Autocomplete type="dropoff" />
          <button
            onClick={() => {
              setIsStopover(true);
            }}
            className={`p-2 w-full text-slate-300 bg-slate-50 border-2 border-slate-50 active:border-slate-100 rounded-lg`}
          >
            Add stopover +
          </button>
          <DateSelecter />

          <button
            className={`p-4 bg-slate-900 w-full mt-5 text-white rounded-lg ${
              !source || !destination || !time
                ? "opacity-85 cursor-not-allowed"
                : ""
            }`}
            onClick={() => {
              setShowDistance(!showDistance);
            }}
          >
            Search
          </button>
        </div>
      </div>

      {distance && showDistance ? <CarListOptions distance={distance} /> : null}
    </div>
  );
}

export default Booking;
