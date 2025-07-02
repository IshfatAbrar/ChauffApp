import { CarListData } from "../../util/CarListData";
import React, { useState, useContext } from "react";
import CarListItem from "./CarListItem";

import ConfirmationForm from "./ConfirmationForm";

function CarListOptions({
  distance,
  duration,
  panDowntoBottom,
  setIsPaymentModalOpen,
  paymentMethod,
}) {
  const [activeIndex, setActiveIndex] = useState();
  const [selectedCar, setSelectedCar] = useState([]);
  const [price, setPrice] = useState();
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="mt-5">
      <h2 className="text-[22px] font-bold">Recommeded</h2>
      <div className="p-2 overflow-auto bg-slate-50">
        {CarListData.map((item, index) => (
          <div
            key={index}
            className={`cursor-pointer rounded-md mb-2
                ${activeIndex == index ? " bg-slate-100" : null}`}
            onClick={() => {
              setActiveIndex(index);
              setSelectedCar(item);
              panDowntoBottom();
            }}
          >
            <CarListItem car={item} distance={distance} />
          </div>
        ))}
      </div>
      {selectedCar?.name && paymentMethod ? (
        <button
          className=" z-10 flex md:fixed mt-2
            bottom-5 right-5 md:left-5 md:right-auto  shadow-xl
              p-3 bg-black text-white text-sm lg:text-lg  rounded-lg
              text-center "
          onClick={() => {
            setPrice((selectedCar.amount * distance).toFixed(2));
            setConfirm(true);
          }}
        >
          Request {selectedCar.name}
        </button>
      ) : selectedCar?.name ? (
        <button
          className=" z-10 flex md:fixed mt-2
        bottom-5 right-5 md:left-5 md:right-auto  shadow-xl
          p-3 bg-black text-white text-sm lg:text-lg  rounded-lg
          text-center"
          onClick={() => {
            setIsPaymentModalOpen(true);
          }}
        >
          Add Payment Method
        </button>
      ) : null}
      {price && confirm && (
        <div className="z-20 fixed left-0 top-0 w-full lg:w-[35%]">
          <ConfirmationForm
            duration={duration}
            price={price}
            selectedCar={selectedCar.name}
            distance={distance}
            setConfirm={setConfirm}
            paymentMethod={paymentMethod}
            setIsPaymentModalOpen={setIsPaymentModalOpen}
          />
        </div>
      )}
    </div>
  );
}

export default CarListOptions;
