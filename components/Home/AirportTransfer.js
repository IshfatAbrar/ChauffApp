import React from "react";
import Link from "next/link";

function AirportTransfer() {
  return (
    <div className="w-full flex items-center justify-center">
      {/* Airport Transfer Section */}
      <div className="flex flex-col  lg:flex-row items-center justify-center gap-12 lg:gap-24 py-12">
        {/* Text and Button Column */}
        <div className="lg:w-1/2 lg:order-2">
          <h1 className="text-5xl font-bold mb-4">Need an airport transfer?</h1>
          <p className="text-lg ">
            Pickup from the airport? Ride to the airport?
          </p>
          <p className="text-lg ">We've got you covered.</p>
          <div className="mt-8">
            <Link
              href="/book" // Replace with your booking page route
              className="px-6 py-3 bg-slate-900 text-white rounded-md text-lg font-semibold hover:bg-slate-800 transition duration-300"
            >
              Book Now
            </Link>
          </div>
        </div>

        {/* Image Column */}
        <div className="lg:order-1">
          <img
            src="sky.jpg" // Replace with your image source
            alt="Image"
            className="w-[612px] h-[408px]  rounded-xl object-cover"
          />
        </div>
      </div>
    </div>
  );
}

export default AirportTransfer;
