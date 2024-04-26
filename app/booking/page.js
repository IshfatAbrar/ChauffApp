"use client";
import Booking from "@/components/Booking/Booking";
import { SourceContext } from "@/context/SourceContext";
import { DestinationContext } from "@/context/DestinationContext";
import Map from "@/components/Map/Map";
import { useState } from "react";
import { LoadScript } from "@react-google-maps/api";
import { ConfirmContext } from "@/context/ConfirmContext";
import { TimeContext } from "@/context/TimeContext";

export default function Home() {
  const [source, setSource] = useState([]);
  const [destination, setDestination] = useState([]);
  const [confirm, setConfirm] = useState(false);
  const [time, setTime] = useState(null);

  return (
    <SourceContext.Provider value={{ source, setSource }}>
      <DestinationContext.Provider value={{ destination, setDestination }}>
        <ConfirmContext.Provider value={{ confirm, setConfirm }}>
          <TimeContext.Provider value={{ time, setTime }}>
            <LoadScript
              libraries={["places"]}
              googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_API_KEY}
            >
              <div className="grid grid-cols-1 md:grid-cols-3">
                <div className="col-span-2 bg-blue-100 md:order-1 lg:order-2">
                  <Map />
                </div>
                <div className=" pt-6 md:pt-16 order-2 md:order-2 lg:order-1 ">
                  <Booking />
                </div>
              </div>
            </LoadScript>
          </TimeContext.Provider>
        </ConfirmContext.Provider>
      </DestinationContext.Provider>
    </SourceContext.Provider>
  );
}
