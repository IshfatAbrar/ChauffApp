import Image from "next/image";
import React from "react";

function CarListItem({ car, distance }) {
  return (
    <div className="py-2 px-4 hover:bg-slate-200 rounded-md">
      <div className="flex flex-row lg:flex-row md:flex-row items-center justify-between">
        <div className="flex flex-col items-start gap-5">
          {/* <Image src={car.image} width={100} height={100} /> */}
          <div>
            <h2
              className="font-semibold text-xl sm:text-md lg:text-xl
                    flex gap-3 items-center"
            >
              {car.name}

              <span
                className="flex gap-2 font-normal
                        text-[14px] justify-center "
              >
                {car.seat}
              </span>
            </h2>
            <p className=" text-xs md:hidden lg:block">{car.desc}</p>
          </div>
        </div>
        <h2 className="text-xl md:text-sm lg:text-xl font-semibold ">
          ${(car.amount * distance).toFixed(2)}
        </h2>
      </div>
      <p className=" text-xxs hidden md:block lg:hidden">{car.desc}</p>
    </div>
  );
}

export default CarListItem;
