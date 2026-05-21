import Image from "next/image";
import * as React from "react";

import { EffectCoverflow, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { motion } from "framer-motion";

const photos = ["/chauffX.png", "/Black.png", "/Comfort.png", "/ChauffXL.png"];
const types = ["Chauff X", "Black", "Comfort", "Chauff XL"];

export default function CoverFlow() {
  return (
    <section className="flex flex-col items-center overflow-hidden justify-center pt-[4rem] pb-[2rem] w-full">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="px-8 lg:px-0 lg:max-w-[60%]"
      >
        <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-3">
          Our fleet
        </p>
        <h1 className="text-4xl lg:text-6xl font-bold mb-3
                       bg-gradient-to-b from-slate-900 via-slate-800 to-slate-500
                       bg-clip-text text-transparent leading-[1.1]">
          A hop, skip, and a jump is just a tap away
        </h1>
        <p className="text-base lg:text-lg text-slate-500 mb-[4rem]">
          Hit the road! Find a ride that fits your style and budget.*
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-5xl"
      >
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
                <div className="flex flex-col w-[300px] items-center justify-center bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow mb-4 h-[350px]">
                  <h1 className="text-lg font-semibold mb-4 text-slate-900">{types[index]}</h1>
                  <Image src={p} alt="Car Models" width={200} height={200} />
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </motion.div>
    </section>
  );
}
