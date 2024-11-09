"use client";
import React, { useState } from "react";

import Intro from "./../components/Home/Intro";

import Driver from "./../components/Home/Driver";
import CoverFlow from "./../components/Home/CoverFlow";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import "swiper/css/thumbs";
import "swiper/css/effect-coverflow";
import "swiper/css/mousewheel";
import "swiper/css/autoplay";
import "swiper/css/effect-fade";
import "swiper/css/grid";
import Safety from "./../components/Home/Safety";
import SecurePay from "./../components/Home/SecurePay";
import Rewind from "./../components/Home/Rewind";
import Payment from "./../components/Home/Payment";

const section_2_buttons = ["Tour", "Airport Transfer", "Corporate Travel"];

export default function Home() {
  const [section, setSection] = useState("Tour");
  return (
    <div className="flex flex-col items-center justify-center gap-12 pb-[250px]">
      <Intro />

      <Rewind />

      <CoverFlow />
      <img
        src="choose_chauff.jpeg"
        className=" w-full h-[400px] object-cover"
      ></img>
      <Safety />

      <Payment />

      <Driver />
    </div>
  );
}
