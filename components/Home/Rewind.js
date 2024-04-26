import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination, EffectFade } from "swiper/modules";

const content = [
  {
    header: "Corporate Travel",
    info: "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Aliquid enim quidem ipsum quos corrupti totam ullam nam, amet, quam dolores saepe assumenda adipisci tenetur, sunt minima et porro unde excepturi?",
    src: "corporate.jpg",
  },
  {
    header: "Airport Transfer",
    info: "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Aliquid enim quidem ipsum quos corrupti totam ullam nam, amet, quam dolores saepe assumenda adipisci tenetur, sunt minima et porro unde excepturi?",
    src: "sky.jpeg",
  },
  {
    header: "Tour",
    info: "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Aliquid enim quidem ipsum quos corrupti totam ullam nam, amet, quam dolores saepe assumenda adipisci tenetur, sunt minima et porro unde excepturi?",
    src: "image_3.jpg",
  },
];

export default function Rewind() {
  return (
    <section className="pt-[2rem] bg-slate-100 w-full px-4 lg:px-0 border-y-2 border-slate-300">
      <div className="flex flex-col items-center justify-center">
        <Swiper
          modules={[Navigation, Autoplay, Pagination, EffectFade]}
          loop={true}
          spaceBetween={30}
          effect="fade"
          className="rewind"
          pagination={{ clickable: true }}
          autoplay={{
            delay: 10000,
            stopOnLastSlide: false,
            disableOnInteraction: false,
          }}
          style={{ width: "100%" }}
          navigation={{
            prevEl: ".swiper-button-prev",
            nextEl: ".swiper-button-next",
          }} // Add navigation custom class names
        >
          {content.map((p, index) => {
            return (
              <SwiperSlide
                className="px-[15%] pb-[4rem] flex items-center justify-center bg-slate-100"
                key={index}
              >
                <div className="px-4 lg:px-0 flex flex-col lg:flex-row gap-6 lg:gap-24 justify-center items-center max-w-[100%]">
                  <img
                    src={p.src}
                    className="lg:w-1/2 h-[400px] object-cover rounded-xl"
                  ></img>
                  <div className="w-full lg:w-1/2">
                    <h1 className="font-bold mb-2 text-4xl">{p.header}</h1>
                    <p>{p.info}</p>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
          {/* Custom navigation buttons */}
          <div
            className="swiper-button-prev"
            style={{ color: "#e2e8f0", fontSize: "20px" }}
          ></div>
          <div
            className="swiper-button-next"
            style={{
              color: "#e2e8f0",
              fontSize: "20px",
            }}
          ></div>
        </Swiper>
      </div>
    </section>
  );
}
