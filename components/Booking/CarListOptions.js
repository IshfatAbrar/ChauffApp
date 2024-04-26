import { CarListData } from "@/util/CarListData";
import React, { useState, useContext } from "react";
import CarListItem from "./CarListItem";
import { ConfirmContext } from "@/context/ConfirmContext";

import ConfirmationForm from "./ConfirmationForm";

function CarListOptions({ distance }) {
  const [activeIndex, setActiveIndex] = useState();
  const [selectedCar, setSelectedCar] = useState([]);
  const [price, setPrice] = useState();
  const { confirm, setConfirm } = useContext(ConfirmContext);

  return (
    <div className="mt-5">
      <h2 className="text-[22px] font-bold">Recommeded</h2>
      <div className="p-2 overflow-auto h-[250px]">
        {CarListData.map((item, index) => (
          <div
            key={index}
            className={`cursor-pointer rounded-md mb-2
                ${activeIndex == index ? " bg-slate-100" : null}`}
            onClick={() => {
              setActiveIndex(index);
              setSelectedCar(item);
            }}
          >
            <CarListItem car={item} distance={distance} />
          </div>
        ))}
      </div>
      {selectedCar?.name ? (
        <button
          className=" z-10 flex md:fixed mt-2
            bottom-5 right-5 md:left-5 md:right-auto  shadow-xl
              p-3 bg-black text-white text-sm lg:text-lg  rounded-lg
              text-center"
          onClick={() => {
            setPrice((selectedCar.amount * distance).toFixed(2));
            setConfirm(true);
          }}
        >
          Request {selectedCar.name}
        </button>
      ) : null}
      {price && (
        <div className="z-20 fixed left-0 top-0 w-full lg:w-[35%]">
          <ConfirmationForm price={price} selectedCar={selectedCar.name} />
        </div>
      )}
    </div>
  );
}

export default CarListOptions;
