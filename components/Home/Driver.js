import React from "react";
import Link from "next/link";

function Driver() {
  return (
    <div>
      <div className="flex flex-col mw-[1200px] lg:flex-row items-center justify-center gap-12 pt-16 px-8">
        {/* Text and Button Column */}
        <div className="lg:w-1/2 lg:px-0 lg:max-w-[500px]">
          <h1 className="text-4xl font-bold mb-4">Be a Driver with us.</h1>
          <p className="text-md text-justify lg:max-w-[450px]">
            We believe transportation is a basic necessity. Getting to polling
            places, healthcare facilities, grocery stores, or to grandma's house
            for a visit. It all requires accessible, dependable transportation.
          </p>
          <div className="mt-8">
            <Link
              href="/book"
              className="px-6 py-3 bg-slate-100 text-slate-800 rounded-full text-xl font-semibold hover:bg-slate-200 transition duration-300"
            >
              Apply to Drive
            </Link>
          </div>
        </div>

        <div>
          <img
            src="Drive_with_us.jpg" // Replace with your image source
            alt="Image"
            className=" w-auto lg:w-4/5 h-auto rounded-2xl"
          />
        </div>
      </div>
    </div>
  );
}

export default Driver;
