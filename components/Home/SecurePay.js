import React from "react";
import Link from "next/link";

function SecurePay() {
  return (
    <div>
      <div className="flex flex-col lg:flex-row items-center justify-center gap-16 px-8">
        <div>
          <img
            src="secure_pay.png" // Replace with your image source
            alt="Image"
            className=" h-[350px] lg:w-full w-auto rounded-2xl"
          />
        </div>
        {/* Text and Button Column */}
        <div className="lg:w-1/2 px-4 lg:px-0">
          <h1 className="text-4xl font-bold mb-4">
            Secure and seamless cashless payments.
          </h1>
          <p className="text-md max-w-[450px]">
            Experience peace of mind with our secure payment method for your
            chauffeur service needs. At Chauff, we prioritize the security of
            your transactions, implementing industry-leading encryption
            protocols to safeguard your sensitive information.
          </p>
          <div className="mt-8">
            <Link
              href="/about#payment"
              className="text-md text-slate-600 font-semibold hover:underline duration-300"
            >
              More about payments <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecurePay;
