import React from "react";
import Link from "next/link";
import Image from "next/image";

function SecurePay() {
  return (
    <div>
      <div className="flex flex-col lg:flex-row items-center justify-center  gap-8 px-8 ">
        <div className=" lg:w-full w-auto rounded-2xl">
          <Image
            src="/secure_pay.png"
            alt="Image"
            layout="fit"
            height="400"
            width="400"
          />
        </div>
        {/* Text and Button Column */}
        <div className="w-full px-4 lg:px-0">
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
