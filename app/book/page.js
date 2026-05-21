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

  // Multi-region support: detect customer's region
  const [customerRegion, setCustomerRegion] = useState("US");
  const [currency, setCurrency] = useState("USD");
  const [stripePublishableKey, setStripePublishableKey] = useState(null);

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

  // Detect customer region on page load
  useEffect(() => {
    const detectRegion = async () => {
      try {
        const res = await fetch("/api/detect-region");
        const data = await res.json();

        if (data.success) {
          setCustomerRegion(data.region);
          setCurrency(data.currency);
          setStripePublishableKey(data.stripePublishableKey);
          console.log(
            `🌍 Customer region detected: ${data.region} (${data.currency})`,
          );
        }
      } catch (error) {
        console.error("Error detecting region:", error);
        // Default to US if detection fails
        setCustomerRegion("US");
        setCurrency("USD");
      }
    };

    detectRegion();
  }, []);

  const fetchPaymentMethod = async () => {
    if (!email) {
      console.log("No email available, skipping payment method fetch");
      return;
    }

    try {
      console.log("Fetching payment method for:", email);
      const res = await fetch("/api/get-payment-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, region: customerRegion }),
      });
      const data = await res.json();
      console.log("Payment method fetched:", data.paymentMethod);
      setPaymentMethod(data.paymentMethod);
    } catch (error) {
      console.error("Error fetching payment method:", error);
    }
  };

  useEffect(() => {
    if (email && customerRegion) {
      fetchPaymentMethod();
    }
  }, [email, customerRegion]);

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
                    <div className="col-span-2 md:order-1 lg:order-2">
                      <Map />
                    </div>
                    <div
                      className="pt-6 md:pt-16 order-2 md:order-2 lg:order-1 border-r border-slate-200 bg-[#f8f8f8] overflow-y-scroll no-scrollbar"
                      style={{ height: window.innerHeight }}
                    >
                      <OneStopTollCalculator setDuration={setDuration} />
                      <Booking
                        duration={duration}
                        setIsPaymentModalOpen={setIsPaymentModalOpen}
                        paymentMethod={paymentMethod}
                        customerRegion={customerRegion}
                        currency={currency}
                      />
                    </div>
                  </div>
                ) : null}
                <PaymentModal
                  isPaymentModalOpen={isPaymentModalOpen}
                  setIsPaymentModalOpen={setIsPaymentModalOpen}
                  onPaymentMethodUpdated={fetchPaymentMethod}
                  customerRegion={customerRegion}
                  stripePublishableKey={stripePublishableKey}
                />
              </TimeContext.Provider>
            </DestinationContext.Provider>
          </SourceContext.Provider>
        </StopoverContext.Provider>
      </TollContext.Provider>
    </DistanceContext.Provider>
  );
}
