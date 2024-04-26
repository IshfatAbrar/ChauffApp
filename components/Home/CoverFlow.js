import * as React from "react";

import { EffectCoverflow, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

const photos = ["chauffX.png", "Black.png", "Comfort.png", "ChauffXL.png"];
const types = ["Chauff X", "Black", "Comfort", "Chauff XL"];

export default function CoverFlow() {
  return (
    <section className="flex flex-col items-center overflow-hidden justify-center pt-[4rem] pb-[2rem] w-full">
      <div className="px-8 lg:px-0 lg:max-w-[60%] ">
        <h1 className="text-4xl lg:text-6xl font-bold mb-[1rem]">
          A hop, skip, and a jump is just a tap away
        </h1>
        <p className="text-md lg:text-lg mb-[4rem]">
          Hit the road! Find a ride that fits your style and budget.*
        </p>
      </div>
      <div className="max-w-5xl ">
        <Swiper
          modules={[EffectCoverflow]}
          effect={"coverflow"}
          loop={true}
          spaceBetween={0}
          slidesPerView={3}
          centeredSlides={true}
          grabCursor={true}
          coverflowEffect={{
            rotate: 0,
            slideShadows: false,
          }}
          className="coverflow"
        >
          {photos.map((p, index) => {
            return (
              <SwiperSlide key={index}>
                <div className="flex flex-col w-[300px] items-center justify-center bg-slate-50 border-b-[2px] border-slate-200 p-4 rounded-2xl shadow-md mb-4 h-[350px]">
                  <h1 className="text-2xl font-bold mb-4">{types[index]}</h1>
                  <img className=" w-2/3" src={p} alt="" />
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </section>
  );
}
