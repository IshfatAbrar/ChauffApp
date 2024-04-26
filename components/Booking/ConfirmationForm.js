"use client";
import React, { useState, useEffect, useContext } from "react";
import { useUser } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import { ConfirmContext } from "@/context/ConfirmContext";
import { TimeContext } from "@/context/TimeContext";

function ConfirmationForm(props) {
  const { isSignedIn, user, isLoaded } = useUser();
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const router = useRouter();
  const { confirm, setConfirm } = useContext(ConfirmContext);
  const { time, setTime } = useContext(TimeContext);

  useEffect(() => {
    setConfirm(true);
  }, []);

  if (!isLoaded) {
    // Handle loading state however you like
    return null;
  }

  console.log(user);
  console.log("Payment: " + props.price);
  console.log("Time: " + time.toString());

  const handleAddressChange = (event) => {
    setAddress(event.target.value);
  };

  const handlePhoneChange = (event) => {
    setPhone(event.target.value);
  };

  const handleCloseClick = () => {
    setConfirm(false); // Hide the ConfirmationForm
  };
  return (
    confirm && (
      <div className=" bg-gray-50 p-4 pb-8">
        <div>
          <button
            onClick={handleCloseClick}
            className=" absolute right-4 p-1 bg-transparent rounded-full"
          >
            <h2 className="h-6 w-6 text-gray-400 hover:text-gray-700">
              <i class="fa-solid fa-xmark"></i>
            </h2>
          </button>
          <h2 className=" text-xl font-bold mb-4 mt-16">
            <i class="fas fa-receipt"></i> Confirmation Form
          </h2>
          <form className="text-sm grid grid-cols-1  gap-6 bg-white p-4 rounded-lg">
            <div>
              <h3 className=" text-lg font-bold mb-4">Your Information</h3>
              <div className="mb-2 ">
                <label className="font-semibold mb-1">Name</label>
                <p>{user.fullName}</p>
              </div>
              <div className="mb-2 ">
                <label className="font-semibold mb-1">Email</label>
                <p>{user.primaryEmailAddress.emailAddress}</p>
              </div>
              <div className="mb-4">
                <label htmlFor="phone" className=" font-semibold mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  id="phone"
                  className="w-full border rounded-md p-2"
                  placeholder="Enter your phone number"
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
                <p>{time.toString()}</p>
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
              <button
                className="bg-slate-900 text-white py-2 px-4 rounded-md hover:bg-slate-800"
                onClick={() => {
                  router.push("/payment?amount=" + props.price);
                }}
              >
                Confirm Ride
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  );
}

export default ConfirmationForm;
