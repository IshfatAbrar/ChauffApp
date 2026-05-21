"use client";
import React, { useState, useEffect } from "react";
import { getOngoingBookings } from "../../lib/actions/booking.actions";
import { useSession } from "next-auth/react";
import StepProgress from "./StepProgress";

function OngoingBooking() {
  const [activeBookings, setActiveBookings] = useState([]);
  const [nonActiveBookings, setNonActiveBookings] = useState([]);
  const [showLoading, setShowLoading] = useState(false);
  const { data: session } = useSession();

  const email = session?.user?.email;

  // Polling interval in milliseconds
  const POLLING_INTERVAL = 10000; // Fetch data every 10 seconds

  const extractDate = (dateString) => {
    const dateObj = new Date(dateString);
    const month = dateObj.toLocaleString("default", { month: "short" });
    const date = dateObj.getDate();
    const year = dateObj.getFullYear();
    let hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours %= 12;
    hours = hours || 12;
    const formattedTime = `${hours < 10 ? "0" : ""}${hours}:${
      minutes < 10 ? "0" : ""
    }${minutes} ${ampm}`;
    return `${month} ${date}, ${year} • ${formattedTime}`;
  };

  const extractLocation = (location) => {
    const parts = location.split(",");
    return parts[0]?.trim() || "Unknown";
  };

  // Fetch ongoing bookings with polling
  useEffect(() => {
    const fetchOngoingBookings = async () => {
      setShowLoading(true);
      try {
        const bookings = await getOngoingBookings(email);
        if (bookings) {
          const active = bookings.filter((booking) => booking.timeline.start);
          const nonActive = bookings.filter(
            (booking) => !booking.timeline.start
          );

          setActiveBookings(active);
          setNonActiveBookings(nonActive);
        }
      } catch (error) {
        console.error("Error fetching active bookings:", error);
      } finally {
        setShowLoading(false);
      }
    };

    if (email) {
      fetchOngoingBookings(); // Fetch immediately
      const intervalId = setInterval(fetchOngoingBookings, POLLING_INTERVAL); // Poll every 10 seconds

      return () => {
        clearInterval(intervalId); // Clear the interval on unmount or dependency change
      };
    }
  }, [email]);

  const renderBookings = (booking) => (
    <div
      key={booking.id}
      className="flex flex-col bg-white p-5 border border-slate-200 rounded-2xl relative mb-4 shadow-sm"
    >
      <h2 className="text-lg lg:text-2xl font-semibold text-slate-900">
        {`${extractLocation(booking.pickup)} to ${extractLocation(
          booking.dropoff
        )}`}
      </h2>

      <p className="text-sm lg:text-md text-slate-500">
        {extractDate(booking.time)}
      </p>
      <p className="text-sm lg:text-md text-slate-500">{`$ ${booking.price}`}</p>
      <p className="text-sm lg:text-md text-slate-500">
        {booking?.chauffeurName
          ? `with ${booking.rider?.name}`
          : "chauffeur not yet assigned"}
      </p>

      {/* Status text */}
      <p className="absolute top-0 right-0 mr-4 mt-4 text-xs md:text-sm text-slate-500 flex items-center gap-1">
        {booking.timeline.start
          ? "Started"
          : booking.timeline.arrive
          ? "Arrived"
          : booking.status}
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{
            backgroundColor: booking.timeline.start
              ? "#22c55e"
              : booking.timeline.arrive
              ? "#22c55e"
              : "#9ca3af",
          }}
        />
      </p>
      {/* StepProgress dynamically updates based on booking.timeline */}
      <StepProgress
        timeline={booking.timeline}
        stopoverLength={booking.stopover.length}
      />
      <p className="text-slate-400 text-xs mt-4">ID: {booking.id}</p>
    </div>
  );

  const renderNoBookings = () => (
    <div className="flex flex-col bg-white p-5 border border-slate-200 rounded-2xl shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        No active trips
        {showLoading && (
          <div
            className="ml-2 text-slate-300 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
            role="status"
          >
            <span className="sr-only">Loading...</span>
          </div>
        )}
      </h2>
    </div>
  );

  return (
    <div className="mb-12">
      <h2 className="mb-4 text-sm font-semibold tracking-[0.25em] uppercase text-slate-400">
        Ongoing trips
      </h2>
      {activeBookings.length === 0 && nonActiveBookings.length === 0
        ? renderNoBookings()
        : null}
      {activeBookings.length > 0 && activeBookings.map(renderBookings)}
      {nonActiveBookings.length > 0 && nonActiveBookings.map(renderBookings)}
    </div>
  );
}

export default OngoingBooking;
