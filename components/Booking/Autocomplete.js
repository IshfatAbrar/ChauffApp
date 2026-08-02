"use client";

import { DestinationContext } from "../../context/DestinationContext";
import { SourceContext } from "../../context/SourceContext";
import { StopoverContext } from "../../context/StopoverContext";
import React, { useContext, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { normalizePlace } from "../../lib/computeRoute";

function Autocomplete({ type, index, handleTrashClick }) {
  const listId = useId();
  const containerRef = useRef(null);
  const skipFetchRef = useRef(false);
  const sessionToken = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`
  );

  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [menuBox, setMenuBox] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [placeholder, setPlaceholder] = useState("Search location");
  const [selectedLabel, setSelectedLabel] = useState("");

  const { setSource } = useContext(SourceContext);
  const { setDestination } = useContext(DestinationContext);
  const { setStopover } = useContext(StopoverContext);

  useEffect(() => {
    setMounted(true);
    if (type === "source") setPlaceholder("Pickup Location");
    else if (type === "stop") setPlaceholder("Stopover Location");
    else setPlaceholder("Dropoff Location");
  }, [type]);

  const applyPlace = (next) => {
    const place = normalizePlace(next);
    if (!place) return false;
    if (type === "source") setSource(place);
    else if (type === "stop") {
      setStopover((prev) => {
        const updated = [...prev];
        updated[index] = place;
        return updated;
      });
    } else setDestination(place);
    return true;
  };

  const clearPlace = () => {
    skipFetchRef.current = true;
    setQuery("");
    setSelectedLabel("");
    setPredictions([]);
    setOpen(false);
    if (type === "source") setSource([]);
    else if (type === "stop") {
      setStopover((prev) => {
        const updated = [...prev];
        updated[index] = { lat: null, lng: null, name: "", label: "" };
        return updated;
      });
    } else setDestination([]);
  };

  const updateMenuBox = () => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuBox({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    });
  };

  useEffect(() => {
    if (!open) return undefined;
    updateMenuBox();
    const onScroll = () => updateMenuBox();
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, predictions.length]);

  useEffect(() => {
    // After a selection we set the input text — do not search again
    if (skipFetchRef.current) {
      skipFetchRef.current = false;
      return undefined;
    }

    const q = query.trim();
    if (q.length < 2) {
      setPredictions([]);
      setOpen(false);
      return undefined;
    }

    // Already confirmed this exact place — keep the menu closed
    if (selectedLabel && q === selectedLabel.trim()) {
      setPredictions([]);
      setOpen(false);
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          input: q,
          sessiontoken: sessionToken.current,
        });
        const res = await fetch(`/api/places/autocomplete?${params}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (!controller.signal.aborted) {
          const list = Array.isArray(data.predictions) ? data.predictions : [];
          setPredictions(list);
          setOpen(list.length > 0);
          updateMenuBox();
        }
      } catch (err) {
        if (err?.name !== "AbortError") {
          console.warn("Autocomplete failed:", err);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, selectedLabel]);

  const selectPrediction = async (prediction) => {
    const placeId = prediction?.place_id;
    if (!placeId) return;

    const label =
      prediction.description ||
      prediction.structured_formatting?.main_text ||
      "";

    skipFetchRef.current = true;
    setResolving(true);
    setOpen(false);
    setPredictions([]);
    setQuery(label);
    setSelectedLabel(label);

    try {
      const params = new URLSearchParams({
        place_id: placeId,
        sessiontoken: sessionToken.current,
      });
      const res = await fetch(`/api/places/details?${params}`);
      const data = await res.json();

      if (!res.ok || !data?.place) {
        throw new Error(data?.message || "Could not resolve that place.");
      }

      const display =
        data.place.label || data.place.name || prediction.description || label;

      skipFetchRef.current = true;
      setQuery(display);
      setSelectedLabel(display);

      const ok = applyPlace({
        lat: data.place.lat,
        lng: data.place.lng,
        name: display,
        label: data.place.name || display,
      });

      if (!ok) {
        throw new Error("That place is missing map coordinates.");
      }

      sessionToken.current =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
    } catch (err) {
      console.error("Place details failed:", err);
      clearPlace();
      alert(err?.message || "Could not use that location. Try another search.");
    } finally {
      setResolving(false);
      setOpen(false);
      setPredictions([]);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setResolving(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const params = new URLSearchParams({
            lat: String(latitude),
            lng: String(longitude),
          });
          const res = await fetch(`/api/places/geocode?${params}`);
          const data = await res.json();
          const display =
            data?.place?.label ||
            data?.place?.name ||
            "Current location";

          skipFetchRef.current = true;
          setQuery(display);
          setSelectedLabel(display);
          setOpen(false);
          setPredictions([]);

          applyPlace({
            lat: data?.place?.lat ?? latitude,
            lng: data?.place?.lng ?? longitude,
            name: display,
            label: data?.place?.name || display,
          });
        } catch {
          skipFetchRef.current = true;
          setQuery("Current location");
          setSelectedLabel("Current location");
          applyPlace({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: "Current location",
            label: "Current location",
          });
        } finally {
          setResolving(false);
        }
      },
      (error) => {
        setResolving(false);
        alert("Error getting your location: " + error.message);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const menu =
    mounted && open && menuBox && predictions.length > 0
      ? createPortal(
          <ul
            id={listId}
            role="listbox"
            className="fixed z-[100001] max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-obsidian p-1 shadow-[0_16px_48px_rgba(0,0,0,0.45)]"
            style={{
              top: menuBox.top,
              left: menuBox.left,
              width: menuBox.width,
            }}
          >
            {predictions.map((prediction) => (
              <li key={prediction.place_id}>
                <button
                  type="button"
                  role="option"
                  aria-selected="false"
                  className="flex w-full flex-col items-start rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/10"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectPrediction(prediction)}
                >
                  <span className="font-body text-[14px] text-paper">
                    {prediction.structured_formatting?.main_text ||
                      prediction.description}
                  </span>
                  {prediction.structured_formatting?.secondary_text ? (
                    <span className="mt-0.5 font-body text-[12px] text-ash">
                      {prediction.structured_formatting.secondary_text}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>,
          document.body
        )
      : null;

  return (
    <div className="flex flex-col" ref={containerRef}>
      {type === "source" ? (
        <label className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
          Where From?
        </label>
      ) : type === "stop" ? (
        <label className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
          Stopover
        </label>
      ) : (
        <label className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
          Where To?
        </label>
      )}

      <div className="flex flex-row items-center rounded-xl border border-white/10 bg-graphite pr-2 transition-colors focus-within:border-white/25">
        <input
          type="text"
          value={query}
          placeholder={resolving ? "Getting location…" : placeholder}
          disabled={resolving}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          className="min-w-0 flex-1 bg-transparent px-3.5 py-3 font-body text-[14px] text-paper outline-none placeholder:text-ash disabled:opacity-70"
          onChange={(e) => {
            skipFetchRef.current = false;
            setSelectedLabel("");
            setQuery(e.target.value);
          }}
          onFocus={() => {
            if (
              predictions.length > 0 &&
              !(selectedLabel && query.trim() === selectedLabel.trim())
            ) {
              setOpen(true);
              updateMenuBox();
            }
          }}
          onBlur={() => {
            setTimeout(() => setOpen(false), 180);
          }}
        />

        {loading || resolving ? (
          <span className="px-2 text-ash" aria-hidden="true">
            <i className="fa-solid fa-spinner fa-spin" />
          </span>
        ) : query ? (
          <button
            type="button"
            className="px-2 text-ash transition-colors hover:text-paper"
            aria-label="Clear location"
            onClick={clearPlace}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        ) : null}

        {type === "source" ? (
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={resolving}
            className="px-3 py-2 text-frost transition-colors hover:text-paper disabled:cursor-not-allowed disabled:opacity-50"
            title="Use my current location"
          >
            <i className="fa-solid fa-location-crosshairs" />
          </button>
        ) : type === "stop" ? (
          <button
            type="button"
            onClick={() => handleTrashClick(index)}
            className="px-2 text-ash transition-colors hover:text-paper"
            aria-label="Remove stopover"
          >
            <i className="fa-solid fa-trash" />
          </button>
        ) : null}
      </div>

      {menu}
    </div>
  );
}

export default Autocomplete;
