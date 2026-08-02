"use client";

import React, { useContext, useEffect, useRef } from "react";
import axios from "axios";
import { SourceContext } from "../../context/SourceContext";
import { DestinationContext } from "../../context/DestinationContext";
import { StopoverContext } from "../../context/StopoverContext";
import { TollContext } from "../../context/TollContext";
import { DistanceContext } from "../../context/DistanceContext";

const hasPlace = (place) =>
  place &&
  typeof place.lat === "number" &&
  typeof place.lng === "number" &&
  Number.isFinite(place.lat) &&
  Number.isFinite(place.lng);

const OneStopTollCalculator = ({ setDuration }) => {
  const { source } = useContext(SourceContext);
  const { destination } = useContext(DestinationContext);
  const { stopover } = useContext(StopoverContext);
  const { setToll } = useContext(TollContext);
  const { setDistance } = useContext(DistanceContext);
  const requestId = useRef(0);

  useEffect(() => {
    if (!hasPlace(source) || !hasPlace(destination)) {
      setDistance(0);
      setToll(0);
      return undefined;
    }

    // Ignore empty stopover slots until the user finishes them
    const incompleteStop = Array.isArray(stopover)
      ? stopover.some((stop) => !hasPlace(stop))
      : false;
    if (incompleteStop) {
      setDistance(0);
      setToll(0);
      return undefined;
    }

    const validStops = Array.isArray(stopover)
      ? stopover.filter(hasPlace)
      : [];

    let cancelled = false;
    const id = ++requestId.current;

    const calculateTolls = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
        const apiUrl =
          "https://routes.googleapis.com/directions/v2:computeRoutes";
        let totalDistance = 0;
        let totalToll = 0;

        setDistance(0);
        setToll(0);

        const allStops = [source, ...validStops, destination];
        const requests = [];

        for (let i = 0; i < allStops.length - 1; i++) {
          const origin = allStops[i];
          const next = allStops[i + 1];

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
                  latitude: next.lat,
                  longitude: next.lng,
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

        const responses = await Promise.all(requests);
        if (cancelled || id !== requestId.current) return;

        responses.forEach((response) => {
          const route = response.data.routes?.[0];
          if (!route) return;

          totalDistance += (route.distanceMeters || 0) / 1000;
          if (route.duration) {
            setDuration(route.duration);
          }

          const estimated =
            route.travelAdvisory?.tollInfo?.estimatedPrice?.[0]?.units;
          if (estimated != null && estimated !== "") {
            const parsed = parseInt(estimated, 10);
            if (!Number.isNaN(parsed)) {
              totalToll += parsed;
            }
          }
        });

        if (totalDistance <= 0) {
          setDistance(0);
          setToll(0);
          return;
        }

        setDistance(totalDistance);
        setToll(totalToll);
      } catch (error) {
        if (cancelled || id !== requestId.current) return;
        console.error("Error calculating route:", error);
        setDistance(0);
        setToll(0);
      }
    };

    calculateTolls();

    return () => {
      cancelled = true;
    };
  }, [source, destination, stopover, setDistance, setToll, setDuration]);

  return null;
};

export default OneStopTollCalculator;
