"use client";
import React, { useState, useEffect } from "react";
import { getActiveBookings } from "../../lib/actions/booking.actions";
import { useSession } from "next-auth/react";
import { deleteBooking } from "../../lib/actions/booking.actions";

function ActiveBooking() {
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

    // Get the month, date, and year from the date object
    const month = dateObj.toLocaleString("default", { month: "short" }); // Get short month name (e.g., May)
    const date = dateObj.getDate(); // Get date (e.g., 04)
    const year = dateObj.getFullYear(); // Get year (e.g., 2024)

    // Get the hours and minutes from the date object
    let hours = dateObj.getHours(); // Get hours (e.g., 23)
    const minutes = dateObj.getMinutes(); // Get minutes (e.g., 0)

    // Convert hours to 12-hour format and determine AM/PM
    const ampm = hours >= 12 ? "PM" : "AM";
    hours %= 12;
    hours = hours || 12; // Handle midnight (0 hours)

    // Format the time as "HH:MM AM/PM"
    const formattedTime = `${hours < 10 ? "0" : ""}${hours}:${
      minutes < 10 ? "0" : ""
    }${minutes} ${ampm}`;

    // Output the results

    return `${month} ${date},  ${year} • ${formattedTime}`;
  }

  function extractLocation(location) {
    const parts = location.split(",");
    const extractedLocation = parts.slice(0, 1).join(",").trim();
    return extractedLocation;
  }

  useEffect(() => {
    const fetchActiveBookings = async () => {
      try {
        const tempBookings = await getActiveBookings(email);
        setBookings(tempBookings || []);
      } catch (error) {
        console.error("Error fetching active bookings:", error);
      }
    };

    if (email) {
      fetchActiveBookings();
    }
  }, [email]);

  const cancelBooking = async (id) => {
    console.log(id);
    try {
      await deleteBooking(id);
      // After successful cancellation, fetch updated bookings
      const tempBookings = await getActiveBookings(email);
      setBookings(tempBookings || []);
    } catch (error) {
      console.error("Error cancelling booking:", error);
    }
  };

  return (
    <div className=" mb-12">
      <h2 className="mb-4 text-2xl font-bold">Active Bookings</h2>
      {bookings.length > 0 ? (
        bookings.map((booking) => (
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
            <p className="text-sm lg:text-md ">{` ${
              booking.chauffeur
                ? "with " + booking.chauffeur
                : "chauffeur not yet assigned"
            }`}</p>

            {/* Status text */}
            <p className="absolute top-0 right-0 mr-4 mt-4 text-gray-500 text-xs md:text-sm">
              {booking.status}{" "}
              <i
                className="fa-solid fa-circle-dot fa-fade"
                style={
                  booking.status === "requested"
                    ? { color: "#FFD43B" }
                    : { color: "black" }
                }
              ></i>
            </p>
            <p className="text-gray-500 text-xs mt-4">ID: {booking.id}</p>

            {/* Order ID text */}
            <button
              className="absolute bottom-0 right-0 mr-4 mb-4 text-red-800 text-xs"
              onClick={() => cancelBooking(booking.id)}
            >
              Cancel Request
            </button>
          </div>
        ))
      ) : (
        <div className="flex flex-col bg-slate-50 p-4 border-slate-300 border-2 rounded-lg">
          <h2 className="text-2xl">
            No active trips {"    "}
            {showLoading && (
              <div
                className="text-slate-300 inline-block h-4 w-4 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                role="status"
              >
                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                  Loading...
                </span>
              </div>
            )}{" "}
          </h2>
        </div>
      )}
    </div>
  );
}

export default ActiveBooking;
