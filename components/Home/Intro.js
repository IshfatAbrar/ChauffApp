import React from "react";
import Link from "next/link";
import Image from "next/image";

function Intro() {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-14 px-4 pt-20 lg:pt-0 lg:px-[15%]  h-screen">
      <div className=" px-4 lg:px-0">
        <h2 className="text-4xl lg:text-6xl font-bold mb-4 leading-8 lg:leading-[4.5rem] ">
          Redefining the rideshare industry
        </h2>
        <p className="text-lg lg:text-2xl max-w-[550px]">
          Simple, affordable, memorable
        </p>
        <p className="text-lg lg:text-2xl max-w-[550px]">
          No cancellations. No waiting.
        </p>
        <div className="mt-8 flex flex-row items-center gap-4">
          <Link
            href="/signup"
            className=" px-5 lg:px-6 py-2 lg:py-3 bg-slate-200 text-black rounded-full text-md lg:text-lg font-semibold hover:bg-slate-300 transition duration-300"
          >
            Sign Up
          </Link>
          <Link className=" underline lg:text-lg" href="/signin">
            Have an account? Sign in
          </Link>
        </div>
      </div>

      <div className="relative w-full lg:w-[75%] h-[400px] lg:h-[600px]">
        <Image
          src="/image_1.jpg"
          alt="Image"
          layout="fill"
          objectFit="cover"
          className="rounded-2xl"
        />
      </div>
    </div>
  );
}

export default Intro;
