"use client";
import PreviousBooking from "../../components/Trips/PreviousBooking";
import OngoingBooking from "../../components/Trips/OngoingBooking";
import React from "react";
import RequestedBooking from "../../components/Trips/RequestedBooking";
import StepProgress from "../../components/Trips/StepProgress";

function page() {
  return (
    <div className=" pb-[200px]">
      <div
        className="flex flex-col justify-end h-[450px] lg:h-[550px] bg-cover  bg-slate-300"
        style={{
          backgroundImage: "url('trips-2.jpeg')",
          backgroundPosition: "30% 70%",
        }}
      >
        <h1 className=" text-4xl lg:text-6xl font-bold pl-8 lg:pl-[15%] pb-8 text-white">
          My Trips
        </h1>
      </div>
      <div className="px-8 lg:px-[15%] pt-12">
        <OngoingBooking />
        <RequestedBooking />
        <PreviousBooking />
      </div>
    </div>
  );
}

export default page;
