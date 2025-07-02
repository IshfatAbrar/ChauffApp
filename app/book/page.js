"use client";
import Booking from "../../components/Booking/Booking";
import { SourceContext } from "../../context/SourceContext";
import { DestinationContext } from "../../context/DestinationContext";
import { StopoverContext } from "../../context/StopoverContext";
import Map from "../../components/Map/Map";
import { React, useState, useEffect } from "react";
import { TimeContext } from "../../context/TimeContext";
import { useJsApiLoader } from "@react-google-maps/api";
import { TollContext } from "../../context/TollContext";
import { DistanceContext } from "../../context/DistanceContext";
import OneStopTollCalculator from "../../components/Map/OneStopTollCalculator";
import PaymentModal from "../../components/Booking/PaymentModal"; // Import the Payment Modal
import { useSession } from "next-auth/react";

export default function Page() {
  const [source, setSource] = useState([]);
  const [destination, setDestination] = useState([]);
  const [stopover, setStopover] = useState([]);
  const [time, setTime] = useState(null);
  const [duration, setDuration] = useState();
  const [toll, setToll] = useState(null);
  const [distance, setDistance] = useState(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false); // State to handle modal visibility
  const [paymentMethod, setPaymentMethod] = useState(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
    libraries: ["places"],
  });

  const handleBookingConfirmation = () => {
    // Logic for booking confirmation, if needed
    setIsPaymentModalOpen(true); // Open the payment modal
  };

  const { data: session } = useSession();
  const email = session?.user?.email;

  const fetchPaymentMethod = async () => {
    try {
      const res = await fetch("/api/get-payment-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setPaymentMethod(data.paymentMethod);
    } catch (error) {
      console.error("Error fetching payment method:", error);
    }
  };

  useEffect(() => {
    fetchPaymentMethod();
  }, []);

  return (
    <DistanceContext.Provider value={{ distance, setDistance }}>
      <TollContext.Provider value={{ toll, setToll }}>
        <StopoverContext.Provider value={{ stopover, setStopover }}>
          <SourceContext.Provider value={{ source, setSource }}>
            <DestinationContext.Provider
              value={{ destination, setDestination }}
            >
              <TimeContext.Provider value={{ time, setTime }}>
                {isLoaded ? (
                  <div className="grid grid-cols-1 md:grid-cols-3">
                    <div className="col-span-2 bg-blue-100 md:order-1 lg:order-2">
                      <Map />
                    </div>
                    <div
                      className="pt-6 md:pt-16 order-2 md:order-2 lg:order-1 border-r-[2px] border-slate-300 overflow-y-scroll no-scrollbar"
                      style={{ height: window.innerHeight }}
                    >
                      <OneStopTollCalculator setDuration={setDuration} />
                      <Booking
                        duration={duration}
                        setIsPaymentModalOpen={setIsPaymentModalOpen}
                        paymentMethod={paymentMethod}
                      />
                    </div>
                  </div>
                ) : null}
                <PaymentModal
                  isPaymentModalOpen={isPaymentModalOpen}
                  setIsPaymentModalOpen={setIsPaymentModalOpen}
                />
              </TimeContext.Provider>
            </DestinationContext.Provider>
          </SourceContext.Provider>
        </StopoverContext.Provider>
      </TollContext.Provider>
    </DistanceContext.Provider>
  );
}
