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

  const POLLING_INTERVAL = 10000;

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

  useEffect(() => {
    const fetchOngoingBookings = async () => {
      setShowLoading(true);
      try {
        const bookings = await getOngoingBookings(email);
        if (bookings) {
          const active = bookings.filter((booking) => booking.timeline.start);
          const nonActive = bookings.filter(
            (booking) => !booking.timeline.start,
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
      fetchOngoingBookings();
      const intervalId = setInterval(fetchOngoingBookings, POLLING_INTERVAL);

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [email]);

  const renderBookings = (booking) => (
    <div
      key={booking.id}
      className="relative mb-4 flex flex-col rounded-2xl border border-white/10 bg-obsidian p-5"
    >
      <h2 className="pr-24 font-instrument text-[22px] font-normal tracking-[-0.02em] text-paper md:text-[28px]">
        {`${extractLocation(booking.pickup)} to ${extractLocation(
          booking.dropoff,
        )}`}
      </h2>

      <p className="mt-1 font-body text-sm text-frost">
        {extractDate(booking.time)}
      </p>
      <p className="font-body text-sm text-frost">{`$ ${booking.price}`}</p>
      <p className="font-body text-sm text-frost">
        {booking?.chauffeurName
          ? `with ${booking.rider?.name}`
          : "chauffeur not yet assigned"}
      </p>

      <p className="absolute right-5 top-5 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ash">
        {booking.timeline.start
          ? "Started"
          : booking.timeline.arrive
            ? "Arrived"
            : booking.status}
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{
            backgroundColor: booking.timeline.start
              ? "#f8f8f8"
              : booking.timeline.arrive
                ? "#f8f8f8"
                : "#808080",
          }}
        />
      </p>

      <StepProgress
        timeline={booking.timeline}
        stopoverLength={booking.stopover.length}
      />
      <p className="mt-2 font-mono text-[11px] text-ash">ID: {booking.id}</p>
    </div>
  );

  const renderNoBookings = () => (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-obsidian p-5">
      <h2 className="flex items-center font-body text-lg text-paper">
        No active trips
        {showLoading && (
          <div
            className="ml-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-ash border-r-transparent"
            role="status"
          >
            <span className="sr-only">Loading...</span>
          </div>
        )}
      </h2>
    </div>
  );

  return (
    <div className="mb-atlas-64">
      <h2 className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-ash">
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
