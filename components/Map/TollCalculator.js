"use client";

import React, { useContext, useState, useEffect } from "react";
import axios from "axios";
import { SourceContext } from "@/context/SourceContext";
import { DestinationContext } from "@/context/DestinationContext";
import { StopoverContext } from "@/context/StopoverContext";
import { IsStopoverContext } from "@/context/IsStopover";
import { TollContext } from "@/context/TollContext";
import { DistanceContext } from "@/context/DistanceContext";

const TollCalculator = () => {
  const { source, setSource } = useContext(SourceContext);
  const { destination, setDestination } = useContext(DestinationContext);
  const { isStopover, setIsStopover } = useContext(IsStopoverContext);
  const { stopover, setStopover } = useContext(StopoverContext);
  const { toll, setToll } = useContext(TollContext);
  const { distance, setDistance } = useContext(DistanceContext);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (source && destination) {
      calculateTolls();
    }
  }, [source, destination, stopover, isStopover]);

  const calculateTolls = async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
      const apiUrl =
        "https://routes.googleapis.com/directions/v2:computeRoutes";

      const requestBody = {
        origin: {
          location: {
            latLng: {
              latitude: source.lat,
              longitude: source.lng,
            },
          },
        },
        destination: {
          location: {
            latLng: {
              latitude: destination.lat,
              longitude: destination.lng,
            },
          },
        },
        travelMode: "DRIVE",
        extraComputations: ["TOLLS"],
        routeModifiers: {
          vehicleInfo: {
            emissionType: "GASOLINE",
          },
        },
      };

      const response = await axios.post(apiUrl, requestBody, {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "routes.duration,routes.distanceMeters,routes.travelAdvisory.tollInfo,routes.legs.travelAdvisory.tollInfo",
        },
      });

      console.log(response);
      const distance = response.data.routes[0].distanceMeters;
      setDistance(distance / 1000);

      const tollInt = parseInt(
        response.data.routes[0].travelAdvisory.tollInfo.estimatedPrice[0].units
      );

      setToll(tollInt);
      setError(null);
    } catch (error) {
      setError("Error calculating tolls. Please try again.");
      console.error("Error:", error);
    }
  };

  return <div></div>;
};

export default TollCalculator;
