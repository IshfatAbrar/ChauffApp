"use client";

import React, { useContext, useState, useEffect } from "react";
import axios from "axios";
import { SourceContext } from "@/context/SourceContext";
import { DestinationContext } from "@/context/DestinationContext";
import { StopoverContext } from "@/context/StopoverContext";

import { TollContext } from "@/context/TollContext";
import { DistanceContext } from "@/context/DistanceContext";

const OneStopTollCalculator = () => {
  const { source, setSource } = useContext(SourceContext);
  const { destination, setDestination } = useContext(DestinationContext);

  const { stopover, setStopover } = useContext(StopoverContext);
  const { toll, setToll } = useContext(TollContext);
  const { distance, setDistance } = useContext(DistanceContext);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (source && destination) {
      calculateTolls();
    }
  }, [source, destination, stopover, stopover.length]);

  const calculateTolls = async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
      const apiUrl =
        "https://routes.googleapis.com/directions/v2:computeRoutes";
      let totalDistance = 0;
      let totalToll = 0;

      const requests = [];
      setDistance(0);
      setToll(0);

      // Calculate tolls and distances for each segment of the journey
      const allStops = [source, ...stopover, destination];
      console.log(allStops);
      for (let i = 0; i < allStops.length - 1; i++) {
        const origin = allStops[i];
        const destination = allStops[i + 1];

        const requestBody = {
          origin: {
            location: {
              latLng: {
                latitude: origin.lat,
                longitude: origin.lng,
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

        requests.push(
          axios.post(apiUrl, requestBody, {
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": apiKey,
              "X-Goog-FieldMask":
                "routes.duration,routes.distanceMeters,routes.travelAdvisory.tollInfo,routes.legs.travelAdvisory.tollInfo",
            },
          })
        );
      }

      // Execute all requests in parallel
      const responses = await Promise.all(requests);
      console.log(responses);

      // Process each response to calculate total toll and distance
      responses.forEach((response) => {
        const route = response.data.routes[0];
        totalDistance += route.distanceMeters / 1000;
      });
      setDistance(totalDistance);

      responses.forEach((response) => {
        const route = response.data.routes[0];

        totalToll += parseInt(
          route.travelAdvisory.tollInfo.estimatedPrice[0].units
        );
      });

      // Update state with total toll and distance
      setToll(totalToll);
      setError(null);
    } catch (error) {
      setError("Error calculating tolls. Please try again.");
      console.error("Error:", error);
    }
  };

  return <div></div>;
};

export default OneStopTollCalculator;
