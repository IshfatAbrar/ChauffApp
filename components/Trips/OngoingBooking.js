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
      className="flex flex-col bg-slate-50 p-4 border-slate-300 border-2 rounded-lg relative mb-4"
    >
      <h2 className="text-lg lg:text-2xl">
        {`${extractLocation(booking.pickup)} to ${extractLocation(
          booking.dropoff
        )}`}
      </h2>

      <p className="text-sm lg:text-md ">{extractDate(booking.time)}</p>
      <p className="text-sm lg:text-md ">{`$ ${booking.price}`}</p>
      <p className="text-sm lg:text-md ">
        {booking?.chauffeurName
          ? `with ${booking.rider?.name}`
          : "chauffeur not yet assigned"}
      </p>

      {/* Status text */}
      <p className="absolute top-0 right-0 mr-4 mt-4 text-gray-500 text-xs md:text-sm">
        {booking.timeline.start ? "Started" : booking.status}{" "}
        <i
          className="fa-solid fa-circle-dot"
          style={{ color: booking.timeline.start ? "#22c55e" : "#6b7280" }}
        ></i>
      </p>
      {/* StepProgress dynamically updates based on booking.timeline */}
      <StepProgress
        timeline={booking.timeline}
        stopoverLength={booking.stopover.length}
      />
      <p className="text-gray-500 text-xs mt-4">ID: {booking.id}</p>
    </div>
  );

  const renderNoBookings = () => (
    <div className="flex flex-col bg-slate-50 p-4 border-slate-300 border-2 rounded-lg">
      <h2 className="text-2xl">
        No active trips{" "}
        {showLoading && (
          <div
            className="text-slate-300 inline-block h-4 w-4 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
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
      <h2 className="mb-4 text-2xl font-bold">Ongoing Bookings</h2>
      {activeBookings.length === 0 && nonActiveBookings.length === 0
        ? renderNoBookings()
        : null}
      {activeBookings.length > 0 && activeBookings.map(renderBookings)}
      {nonActiveBookings.length > 0 && nonActiveBookings.map(renderBookings)}
    </div>
  );
}

export default OngoingBooking;
