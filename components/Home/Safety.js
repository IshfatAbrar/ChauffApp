import React from "react";
import Link from "next/link";
import Image from "next/image";

function Safety() {
  return (
    <div>
      <div className="flex flex-col lg:flex-row items-center justify-center gap-12 py-16 px-8">
        {/* Text and Button Column */}
        <div className="lg:w-1/2 lg:px-0 lg:max-w-[500px]">
          <h1 className="text-4xl font-bold mb-4">
            Safety for all means looking out for our riders
          </h1>
          <p className="text-md text-justify lg:max-w-[450px]">
            We believe transportation is a basic necessity. Getting to polling
            places, healthcare facilities, grocery stores, or to grandma&apos;s
            house for a visit. It all requires accessible, dependable
            transportation.
          </p>
          <div className="mt-8">
            <Link
              href="/about#safety"
              className="text-md text-slate-600 font-semibold hover:underline duration-300"
            >
              More about our Safety features{" "}
              <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>
        </div>

        {/* Image Column */}
        <div className="flex justify-center w-full lg:w-1/2">
          <div className="w-full lg:w-4/5 h-auto">
            <Image
              src="/safety-home-page.jpg"
              alt="Image"
              height={550}
              width={550}
              className="rounded-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Safety;
