"use client";
import React, { useState, useEffect } from "react";
import {
  getActiveBookings,
  getPreviousBookings,
  deleteBooking,
} from "@/lib/actions/booking.actions";
import { useSession } from "next-auth/react";
import jsPDF from "jspdf";

function PreviousBooking() {
  const [bookings, setBookings] = useState([]);
  const { data: session } = useSession();

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
    // Get the content of the div to be converted to PDF
    const content = document.getElementById(`booking_${id}`);

    // Create a new jsPDF instance
    const doc = new jsPDF({ orientation: "landscape" });

    // Convert the div content to PDF
    doc.html(content, {
      callback: function (doc) {
        // Save the PDF
        doc.save(`receipt_${id}.pdf`);
      },
    });
  };

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">Previous Bookings</h2>
      {bookings.length > 0 ? (
        bookings.map((booking) => (
          <div
            id={`booking_${booking.id}`}
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
              {booking.status} <i className="fa-solid fa-circle-dot"></i>
            </p>
            <p className="text-gray-500 text-xs mt-4">ID: {booking.id}</p>

            {/* Order ID text */}
            <button
              className="absolute bottom-0 right-0 mr-4 mb-4 text-red-800 text-xs"
              onClick={() => getReceipt(booking.id)}
            >
              Get Receipt
            </button>
          </div>
        ))
      ) : (
        <div className="flex flex-col bg-slate-50 p-4 border-slate-300 border-2 rounded-lg">
          <h2 className="text-2xl">No previous trips </h2>
        </div>
      )}
    </div>
  );
}

export default PreviousBooking;
