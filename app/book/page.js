"use client";
import Booking from "../../components/Booking/Booking";
import { SourceContext } from "../../context/SourceContext";
import { DestinationContext } from "../../context/DestinationContext";
import { StopoverContext } from "../../context/StopoverContext";
import Map from "../../components/Map/Map";
import { React, useState, useEffect, useRef } from "react";
import { TimeContext } from "../../context/TimeContext";
import { useJsApiLoader } from "@react-google-maps/api";
import { googleMapsLoaderOptions } from "../../lib/googleMapsLoader";
import { TollContext } from "../../context/TollContext";
import { DistanceContext } from "../../context/DistanceContext";
import OneStopTollCalculator from "../../components/Map/OneStopTollCalculator";
import PaymentModal from "../../components/Booking/PaymentModal";
import { useSession } from "next-auth/react";
import HomeNavbar from "../../components/Home/HomeNavbar";

export default function Page() {
  const [source, setSource] = useState([]);
  const [destination, setDestination] = useState([]);
  const [stopover, setStopover] = useState([]);
  const [time, setTime] = useState(null);
  const [duration, setDuration] = useState();
  const [toll, setToll] = useState(null);
  const [distance, setDistance] = useState(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);

  // Multi-region support: detect customer's region
  const [customerRegion, setCustomerRegion] = useState("US");
  const [currency, setCurrency] = useState("USD");
  const [stripePublishableKey, setStripePublishableKey] = useState(null);
  const [regionReady, setRegionReady] = useState(false);
  const paymentMethodFetchId = useRef(0);

  const { isLoaded } = useJsApiLoader(googleMapsLoaderOptions);

  const { data: session, status } = useSession();
  const email = session?.user?.email;
  const isCustomer =
    status === "authenticated" && session?.user?.role === "user";

  // Logged-in customers use account region; anonymous preview uses IP detect
  useEffect(() => {
    if (status === "loading") return;

    let cancelled = false;

    const loadRegion = async () => {
      setRegionReady(false);
      try {
        if (isCustomer) {
          const res = await fetch("/api/customer/me");
          const data = await res.json();
          if (!cancelled && res.ok) {
            setCustomerRegion(data.user?.region || "US");
            setCurrency(data.currency || "USD");
            setStripePublishableKey(data.stripePublishableKey || null);
            console.log(
              `🌍 Account region: ${data.user?.region} (${data.currency})`,
            );
            return;
          }
        }

        const res = await fetch("/api/detect-region");
        const data = await res.json();
        if (!cancelled && data.success) {
          setCustomerRegion(data.region);
          setCurrency(data.currency);
          setStripePublishableKey(data.stripePublishableKey);
          console.log(
            `🌍 Customer region detected: ${data.region} (${data.currency})`,
          );
        }
      } catch (error) {
        console.error("Error loading region:", error);
        if (!cancelled) {
          setCustomerRegion("US");
          setCurrency("USD");
        }
      } finally {
        if (!cancelled) setRegionReady(true);
      }
    };

    loadRegion();
    return () => {
      cancelled = true;
    };
  }, [status, isCustomer]);

  const fetchPaymentMethod = async (region = customerRegion) => {
    if (!email || !regionReady) {
      return;
    }

    const fetchId = ++paymentMethodFetchId.current;

    try {
      console.log(`Fetching payment method for ${email} in region ${region}`);
      const res = await fetch("/api/get-payment-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, region }),
      });
      const data = await res.json();

      // Ignore stale responses from an older region fetch
      if (fetchId !== paymentMethodFetchId.current) {
        return;
      }

      console.log("Payment method fetched:", data.paymentMethod);
      setPaymentMethod(data.paymentMethod);
    } catch (error) {
      console.error("Error fetching payment method:", error);
    }
  };

  useEffect(() => {
    if (email && regionReady) {
      setPaymentMethod(null);
      fetchPaymentMethod(customerRegion);
    }
  }, [email, customerRegion, regionReady]);

  return (
    <DistanceContext.Provider value={{ distance, setDistance }}>
      <TollContext.Provider value={{ toll, setToll }}>
        <StopoverContext.Provider value={{ stopover, setStopover }}>
          <SourceContext.Provider value={{ source, setSource }}>
            <DestinationContext.Provider
              value={{ destination, setDestination }}
            >
              <TimeContext.Provider value={{ time, setTime }}>
                <main className="min-h-screen bg-void font-display text-paper">
                  <HomeNavbar />
                  {isLoaded ? (
                    <div className="grid grid-cols-1 gap-3 px-3 pb-3 md:h-[calc(100svh-5.5rem)] md:grid-cols-3 md:px-4 md:pb-4">
                      <div className="order-2 rounded-[24px] border border-white/10 bg-obsidian md:order-1 md:h-full md:overflow-y-auto md:no-scrollbar">
                        <OneStopTollCalculator />
                        <Booking
                          setDuration={setDuration}
                          setIsPaymentModalOpen={setIsPaymentModalOpen}
                          paymentMethod={paymentMethod}
                          customerRegion={customerRegion}
                          currency={currency}
                        />
                      </div>
                      <div className="relative order-1 h-[42svh] min-h-[280px] overflow-hidden rounded-[24px] border border-white/10 md:order-2 md:col-span-2 md:h-full md:rounded-[32px]">
                        <Map />
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-[calc(100svh-5.5rem)] items-center justify-center px-6">
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ash">
                        Preparing your chauffeur map…
                      </p>
                    </div>
                  )}
                  <PaymentModal
                    isPaymentModalOpen={isPaymentModalOpen}
                    setIsPaymentModalOpen={setIsPaymentModalOpen}
                    onPaymentMethodUpdated={fetchPaymentMethod}
                    customerRegion={customerRegion}
                    stripePublishableKey={stripePublishableKey}
                  />
                </main>
              </TimeContext.Provider>
            </DestinationContext.Provider>
          </SourceContext.Provider>
        </StopoverContext.Provider>
      </TollContext.Provider>
    </DistanceContext.Provider>
  );
}
