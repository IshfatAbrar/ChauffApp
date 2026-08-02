"use client";

import { useContext, useEffect, useRef } from "react";
import { SourceContext } from "../../context/SourceContext";
import { DestinationContext } from "../../context/DestinationContext";
import { StopoverContext } from "../../context/StopoverContext";
import { TollContext } from "../../context/TollContext";
import { DistanceContext } from "../../context/DistanceContext";
import { computeRoute, hasPlace } from "../../lib/computeRoute";

/**
 * Keeps distance/toll in sync when places change (map + pricing).
 * Search also computes explicitly on button press.
 */
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

    if (Array.isArray(stopover) && stopover.some((stop) => !hasPlace(stop))) {
      setDistance(0);
      setToll(0);
      return undefined;
    }

    const id = ++requestId.current;
    let cancelled = false;

    (async () => {
      try {
        const result = await computeRoute(source, destination, stopover);
        if (cancelled || id !== requestId.current) return;
        setDistance(result.distanceKm);
        setToll(result.toll || 0);
        if (typeof setDuration === "function") {
          setDuration(result.duration);
        }
      } catch (error) {
        if (cancelled || id !== requestId.current) return;
        console.error("Background route calculate failed:", error);
        setDistance(0);
        setToll(0);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [source, destination, stopover, setDistance, setToll, setDuration]);

  return null;
};

export default OneStopTollCalculator;
