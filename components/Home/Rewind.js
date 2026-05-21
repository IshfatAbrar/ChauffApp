import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination, EffectFade } from "swiper/modules";
import Image from "next/image";
import { motion } from "framer-motion";

const content = [
  {
    header: "Corporate Travel",
    info: "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Aliquid enim quidem ipsum quos corrupti totam ullam nam, amet, quam dolores saepe assumenda adipisci tenetur, sunt minima et porro unde excepturi?",
    src: "/corporate.jpg",
  },
  {
    header: "Airport Transfer",
    info: "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Aliquid enim quidem ipsum quos corrupti totam ullam nam, amet, quam dolores saepe assumenda adipisci tenetur, sunt minima et porro unde excepturi?",
    src: "/sky.jpeg",
  },
  {
    header: "Tour",
    info: "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Aliquid enim quidem ipsum quos corrupti totam ullam nam, amet, quam dolores saepe assumenda adipisci tenetur, sunt minima et porro unde excepturi?",
    src: "/image_3.jpg",
  },
];

export default function Rewind() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="pt-[2rem] bg-[#f8f8f8] w-full px-4 lg:px-0"
    >
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
                className="px-[15%] pb-[4rem] flex items-center justify-center bg-[#f8f8f8]"
                key={index}
              >
                <div className="px-4 lg:px-0 flex flex-col lg:flex-row gap-6 lg:gap-24 justify-center items-center max-w-[100%]">
                  <Image
                    src={p.src}
                    className="object-cover rounded-2xl shadow-sm"
                    height="600"
                    width="600"
                  />

                  <div className="w-full lg:w-1/2">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-3">
                      Our services
                    </p>
                    <h1
                      className="font-bold mb-3 text-4xl min-w-[200px]
                                   bg-gradient-to-b from-slate-900 to-slate-500
                                   bg-clip-text text-transparent"
                    >
                      {p.header}
                    </h1>
                    <p className="min-w-[300px] text-slate-500">{p.info}</p>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
          {/* Custom navigation buttons */}
          <div
            className="swiper-button-prev"
            style={{ color: "#cbd5e1", fontSize: "20px" }}
          ></div>
          <div
            className="swiper-button-next"
            style={{ color: "#cbd5e1", fontSize: "20px" }}
          ></div>
        </Swiper>
      </div>
    </motion.section>
  );
}
