import React from "react";
import Link from "next/link";

function Tour() {
  return (
    <div className="w-full flex items-center justify-center">
      {/* Airport Transfer Section */}
      <div className="flex flex-col  lg:flex-row items-center justify-center gap-12 lg:gap-24 py-12">
        {/* Text and Button Column */}
        <div className="lg:w-1/2 lg:order-2">
          <h1 className="text-5xl font-bold mb-4">Need an Airport Transfer?</h1>
          <p className="text-lg ">
            To the east or the west - Australia is stunning.
          </p>
          <p className="text-lg ">
            For a day or seven, we will take you to your spot.
          </p>
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
            src="image_3.jpg" // Replace with your image source
            alt="Image"
            className="w-[612px] h-[408px]  rounded-xl object-cover"
          />
        </div>
      </div>
    </div>
  );
}

export default Tour;
