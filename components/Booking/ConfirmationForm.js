"use client";
import React, { useState, useEffect, useContext } from "react";

import { useRouter } from "next/navigation";
import { ConfirmContext } from "@/context/ConfirmContext";
import { TimeContext } from "@/context/TimeContext";
import { useSession } from "next-auth/react";
import { getPhone } from "@/lib/actions/booking.actions";
import { createBooking } from "@/lib/actions/booking.actions";

import { SourceContext } from "@/context/SourceContext";
import { DestinationContext } from "@/context/DestinationContext";
import { StopoverContext } from "@/context/StopoverContext";

import { CSSTransition } from "react-transition-group";
import "./ConfirmationForm.css";

function ConfirmationForm(props) {
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const router = useRouter();
  const { confirm, setConfirm } = useContext(ConfirmContext);
  const { time, setTime } = useContext(TimeContext);
  const { data: session } = useSession();
  const name = session?.user?.name;
  const email = session?.user?.email;
  const { source, setSource } = useContext(SourceContext);
  const { destination, setDestination } = useContext(DestinationContext);
  const { stopover, setStopover } = useContext(StopoverContext);

  const timeString = time?.toString() ?? "";

  useEffect(() => {
    setConfirm(true);
  }, []);

  useEffect(() => {
    const fetchPhone = async () => {
      try {
        const userPhone = await getPhone(email);
        setPhone(userPhone);
      } catch (error) {
        console.error("Error fetching phone number:", error);
      }
    };

    if (email) {
      fetchPhone();
    }
  }, [email]);

  const handleCloseClick = () => {
    setConfirm(false); // Hide the ConfirmationForm
  };

  const createBookingHandler = async (e) => {
    e.preventDefault();
    try {
      const bookingDetails = {
        detailedLocation: address,
        phoneNumber: phone,
        notes: notes,
        time: time.toString(),
        selectedCar: props.selectedCar,
        duration: props.duration,
        distance: props.distance,
        price: props.price,
        pickupLocation: source,
        location: {
          type: "Point",
          coordinates: [source.lng, source.lat],
        },
        dropoffLocation: destination,
        stopoverLocation: stopover,
        status: "requested",
        stripeId: "012343t86325",
      };

      // Call createBooking function with email and booking details
      const newBooking = await createBooking(email, bookingDetails);
      console.log(newBooking);
      if (newBooking) {
        const form = e.target;
        form.reset();
        router.push("/trips");
      }
      // Redirect user to payment page
      // router.push("/payment?amount=" + props.price);
    } catch (error) {
      console.error("Error creating booking:", error);
      // Handle error
    }
  };
  return (
    <CSSTransition
      in={confirm}
      timeout={300}
      classNames="confirmation-form"
      unmountOnExit
    >
      <div className={` bg-gray-50 p-4 pb-8`}>
        <div>
          <button
            onClick={handleCloseClick}
            className=" absolute right-4 p-1 md:mt-12 md:mr-2 bg-transparent rounded-full"
          >
            <h2 className="h-6 w-6 text-gray-400 hover:text-gray-700">
              <i class="fa-solid fa-xmark"></i>
            </h2>
          </button>
          <h2 className=" text-xl font-bold mb-4 mt-16">
            <i class="fas fa-receipt"></i> Confirmation Form
          </h2>
          <form
            onSubmit={createBookingHandler}
            className="text-sm grid grid-cols-1  gap-6 bg-white p-4 rounded-lg"
          >
            <div>
              <h3 className=" text-lg font-bold mb-4">Your Information</h3>
              <div className="mb-2 ">
                <label className="font-semibold mb-1">Name</label>
                <p>{name}</p>
              </div>
              <div className="mb-2 ">
                <label className="font-semibold mb-1">Email</label>
                <p>{email}</p>
              </div>
              <div className="mb-4">
                <label htmlFor="phone" className=" font-semibold mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  id="phone"
                  onChange={(e) => {
                    setPhone(e.target.value);
                  }}
                  className="w-full border rounded-md p-2"
                  placeholder={phone}
                />
              </div>
              <h3 className=" text-lg font-bold mb-4">
                Additional Instructions
              </h3>
              <div className="mb-4">
                <label htmlFor="address" className="block font-semibold mb-1">
                  Detailed Address
                </label>
                <input
                  type="text"
                  id="address"
                  onChange={(e) => {
                    setAddress(e.target.value);
                  }}
                  className="w-full border rounded-md p-2"
                  placeholder="Enter your address"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="notes" className="block font-semibold mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  className="w-full border rounded-md p-2"
                  onChange={(e) => {
                    setNotes(e.target.value);
                  }}
                  placeholder="Enter any additional notes"
                  rows="3"
                ></textarea>
              </div>
            </div>
            <div>
              <h3 className=" text-lg font-bold mb-4">Pickup Details</h3>
              <div className="mb-2 ">
                <label className="font-semibold mb-1">
                  Date & Time of Pickup
                </label>
                <p>{timeString}</p>
              </div>
              <div className="mb-4">
                <label htmlFor="car" className=" font-semibold mb-1">
                  Selected Car
                </label>
                <p>{props.selectedCar}</p>
              </div>
              <div className="mb-4">
                <label htmlFor="payment" className="font-semibold mb-1">
                  Payment Amount
                </label>
                <p>{props.price}</p>
              </div>
              <button className="bg-slate-900 text-white py-2 px-4 rounded-md hover:bg-slate-800">
                Confirm Ride
              </button>
            </div>
          </form>
        </div>
      </div>
    </CSSTransition>
  );
}

export default ConfirmationForm;
