"use client";
import React, { useState, useEffect } from "react";
import { getRequestedBookings } from "../../lib/actions/booking.actions";
import { useSession } from "next-auth/react";
import { deleteBooking } from "../../lib/actions/booking.actions";

function RequestedBooking() {
  const [bookings, setBookings] = useState([]);
  const { data: session } = useSession();

  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    setShowLoading(true);

    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const email = session?.user?.email;

  function extractDate(dateString) {
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

    return `${month} ${date},  ${year} • ${formattedTime}`;
  }

  function extractLocation(location) {
    const parts = location.split(",");
    const extractedLocation = parts.slice(0, 1).join(",").trim();
    return extractedLocation;
  }

  useEffect(() => {
    const fetchRequestedBookings = async () => {
      try {
        const tempBookings = await getRequestedBookings(email);
        setBookings(tempBookings || []);
      } catch (error) {
        console.error("Error fetching requested bookings:", error);
      }
    };

    if (email) {
      fetchRequestedBookings();
    }
  }, [email]);

  const cancelBooking = async (id) => {
    console.log(id);
    try {
      await deleteBooking(id);
      const tempBookings = await getRequestedBookings(email);
      setBookings(tempBookings || []);
    } catch (error) {
      console.error("Error cancelling booking:", error);
    }
  };

  return (
    <div className="mb-atlas-64">
      <h2 className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-ash">
        Upcoming requests
      </h2>
      {bookings.length > 0 ? (
        bookings.map((booking) => (
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
            <p className="font-body text-sm text-frost">{` ${
              booking.chauffeur
                ? "with " + booking.chauffeur
                : "chauffeur not yet assigned"
            }`}</p>

            <p className="absolute right-5 top-5 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ash">
              {booking.status}
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{
                  backgroundColor:
                    booking.status === "requested" ? "#cccccc" : "#808080",
                }}
              />
            </p>
            <p className="mt-4 font-mono text-[11px] text-ash">
              ID: {booking.id}
            </p>

            <button
              className="absolute bottom-5 right-5 font-mono text-[11px] uppercase tracking-[0.12em] text-ash transition-colors hover:text-paper"
              onClick={() => cancelBooking(booking.id)}
            >
              Cancel Request
            </button>
          </div>
        ))
      ) : (
        <div className="flex flex-col rounded-2xl border border-white/10 bg-obsidian p-5">
          <h2 className="flex items-center font-body text-lg text-paper">
            No requested trips
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
      )}
    </div>
  );
}

export default RequestedBooking;
