import React from "react";
import Link from "next/link";
import Image from "next/image";

function Driver() {
  return (
    <div>
      <div className="flex flex-col lg:flex-row items-center justify-center gap-24 pt-16 px-8">
        {/* Text and Button Column */}
        <div className="lg:w-1/2 lg:px-0 lg:max-w-[500px]">
          <h1 className="text-4xl font-bold mb-4">Be a Driver with us.</h1>
          <p className="text-md text-justify lg:max-w-[450px]">
            We believe transportation is a basic necessity. Getting to polling
            places, healthcare facilities, grocery stores, or to grandma&apos;s
            house for a visit. It all requires accessible, dependable
            transportation.
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

        <div className="flex justify-center w-full lg:w-1/2">
          <div className="w-full lg:w-4/5 h-auto">
            <Image
              src="/Drive_with_us.jpg"
              alt="Image"
              layout="responsive"
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

export default Driver;
