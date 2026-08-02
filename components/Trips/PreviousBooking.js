"use client";
import React, { useState, useEffect } from "react";
import {
  getPreviousBookings,
} from "../../lib/actions/booking.actions";
import { useSession } from "next-auth/react";
import jsPDF from "jspdf";

function PreviousBooking() {
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
    const fetchPrevBookings = async () => {
      try {
        const tempBookings = await getPreviousBookings(email);
        setBookings(tempBookings || []);
      } catch (error) {
        console.error("Error fetching active bookings:", error);
      }
    };

    if (email) {
      fetchPrevBookings();
    }
  }, [email]);

  const getReceipt = async (id) => {
    const content = document.getElementById(`booking_${id}`);

    const doc = new jsPDF({ orientation: "landscape" });

    doc.html(content, {
      callback: function (doc) {
        doc.save(`receipt_${id}.pdf`);
      },
    });
  };

  return (
    <div>
      <h2 className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-ash">
        Previous trips
      </h2>
      {bookings.length > 0 ? (
        bookings.map((booking) => (
          <div
            id={`booking_${booking.id}`}
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
              <span className="inline-block h-2 w-2 rounded-full bg-ash" />
            </p>
            <p className="mt-4 font-mono text-[11px] text-ash">
              ID: {booking.id}
            </p>

            <button
              className="absolute bottom-5 right-5 font-mono text-[11px] uppercase tracking-[0.12em] text-frost transition-colors hover:text-paper"
              onClick={() => getReceipt(booking.id)}
            >
              Get Receipt
            </button>
          </div>
        ))
      ) : (
        <div className="flex flex-col rounded-2xl border border-white/10 bg-obsidian p-5">
          <h2 className="flex items-center font-body text-lg text-paper">
            No previous trips
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

export default PreviousBooking;
