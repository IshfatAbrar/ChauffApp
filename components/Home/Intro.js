import React from "react";
import Link from "next/link";

function Intro() {
  return (
    <div className="flex flex-col lg:flex-row items-center gap-14 px-4 pt-20 lg:pt-0 lg:px-[15%]  h-screen">
      <div className=" px-4 lg:px-0">
        <p className="text-sm lg:text-md">
          For the riders. For the drivers. For the community.
        </p>

        <h1 className="text-4xl lg:text-8xl font-bold mb-4">
          Redefining the rideshare industry
        </h1>
        <p className="text-lg lg:text-2xl max-w-[550px]">
          Simple, affordable, memorable
        </p>
        <p className="text-lg lg:text-2xl max-w-[550px]">
          No cancellations. No waiting.
        </p>
        <div className="mt-8">
          <Link
            href="/sign-up"
            className=" px-3 lg:px-6 py-2 lg:py-3 bg-slate-100 text-slate-800 rounded-full text-xl lg:text-2xl font-semibold hover:bg-slate-200 transition duration-300"
          >
            Sign Up
          </Link>
        </div>
      </div>

      <img
        src="image_1.jpg" // Replace with your image source
        alt="Image"
        className=" object-cover w-full lg:w-auto h-[550px] lg:h-auto rounded-2xl"
      />
    </div>
  );
}

export default Intro;
