"use client";

import React, { useContext, useState, useEffect } from "react";
import axios from "axios";
import { SourceContext } from "@/context/SourceContext";
import { DestinationContext } from "@/context/DestinationContext";
import { StopoverContext } from "@/context/StopoverContext";
import { IsStopoverContext } from "@/context/IsStopover";
import { TollContext } from "@/context/TollContext";
import { DistanceContext } from "@/context/DistanceContext";

const OneStopTollCalculator = () => {
  const { source, setSource } = useContext(SourceContext);
  const { destination, setDestination } = useContext(DestinationContext);
  const { isStopover, setIsStopover } = useContext(IsStopoverContext);
  const { stopover, setStopover } = useContext(StopoverContext);
  const { toll, setToll } = useContext(TollContext);
  const { distance, setDistance } = useContext(DistanceContext);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (source && destination && stopover) {
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
              latitude: stopover.lat,
              longitude: stopover.lng,
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

      const requestBodyTwo = {
        origin: {
          location: {
            latLng: {
              latitude: stopover.lat,
              longitude: stopover.lng,
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

      const distance = response.data.routes[0].distanceMeters / 1000;

      const response2 = await axios.post(apiUrl, requestBodyTwo, {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "routes.duration,routes.distanceMeters,routes.travelAdvisory.tollInfo,routes.legs.travelAdvisory.tollInfo",
        },
      });

      const distance2 = response2.data.routes[0].distanceMeters / 1000;
      setDistance(distance + distance2);

      const toll_1 = parseInt(
        response.data.routes[0].travelAdvisory.tollInfo.estimatedPrice[0].units
      );

      const toll_2 = parseInt(
        response2.data.routes[0].travelAdvisory.tollInfo.estimatedPrice[0].units
      );

      setToll(toll_1 + toll_2);
      setError(null);
    } catch (error) {
      setError("Error calculating tolls. Please try again.");
      console.error("Error:", error);
    }
  };

  return <div></div>;
};

export default OneStopTollCalculator;
