"use client";
import React, { useContext, useEffect, useState } from "react";
import Autocomplete from "./Autocomplete";
import { SourceContext } from "@/context/SourceContext";
import { DestinationContext } from "@/context/DestinationContext";
import { StopoverContext } from "@/context/StopoverContext";
import DateSelecter from "./DateSelecter";
import CarListOptions from "./CarListOptions";
import { TimeContext } from "@/context/TimeContext";
import { DistanceContext } from "@/context/DistanceContext";
import { TollContext } from "@/context/TollContext";

function Booking() {
  const { source, setSource } = useContext(SourceContext);
  const { destination, setDestination } = useContext(DestinationContext);
  const { stopover, setStopover } = useContext(StopoverContext);

  const { time, setTime } = useContext(TimeContext);
  const { distance, setDistance } = useContext(DistanceContext);
  const { toll, setToll } = useContext(TollContext);
  const [showDistance, setShowDistance] = useState(false);
  const [error, setError] = useState(false);
  const [max, setMax] = useState(false);

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
  console.log(toll);

  useEffect(() => {
    if (!source) {
      setDistance(0);
    }
    if (destination) {
      setDistance(0);
    }
  }, [source, destination]);

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
    return;
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
    <div className="flex flex-col p-5 md:pt-12">
      <div className="flex flex-col rounded-md p-4 w-full">
        <h2 className="text-[20px] font-bold">Booking</h2>
        {error && (
          <p className=" bg-red-100 text-red-800 mt-2 text-xs rounded-md p-2">
            <i class="fa-solid fa-triangle-exclamation"></i>
            {"  "}Please enter all the fields
          </p>
        )}
        <div className="flex flex-col gap-2 mt-4 ">
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
            className={`p-2  w-full  rounded-lg ${
              max
                ? "text-slate-300  border-2 border-slate-100 "
                : "text-slate-600  border-2 border-slate-200 active:border-slate-300"
            }`}
          >
            + Add stopover
          </button>
          <DateSelecter />

          <button
            className={`p-4 bg-black w-full mt-4 text-white rounded-lg`}
            onClick={onSearchHandler}
          >
            Search
          </button>
        </div>
      </div>

      {!error && distance && showDistance ? (
        <CarListOptions distance={distance} />
      ) : null}
    </div>
  );
}

export default Booking;
