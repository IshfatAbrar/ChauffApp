"use client";

import { DestinationContext } from "../../context/DestinationContext";
import { SourceContext } from "../../context/SourceContext";
import { StopoverContext } from "../../context/StopoverContext";
import React, { useContext, useEffect, useState } from "react";
import GooglePlacesAutocomplete from "react-google-places-autocomplete";

const placesStyles = {
  control: (provided) => ({
    ...provided,
    background: "transparent",
    border: "none",
    boxShadow: "none",
    cursor: "text",
    minHeight: 44,
    ":hover": {
      border: "none",
    },
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "2px 8px",
  }),
  input: (provided) => ({
    ...provided,
    color: "#f8f8f8",
    outline: "none",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#f8f8f8",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#808080",
  }),
  menu: (provided) => ({
    ...provided,
    background: "#1e1e1e",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    overflow: "hidden",
    zIndex: 9999,
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 9999,
  }),
  menuList: (provided) => ({
    ...provided,
    padding: 4,
  }),
  option: (provided, state) => ({
    ...provided,
    background: state.isFocused ? "#272727" : "transparent",
    color: "#f8f8f8",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
};

function Autocomplete({ type, index, handleTrashClick }) {
  const [value, setValue] = useState(null);
  const [placeholder, setPlaceholder] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const { source, setSource } = useContext(SourceContext);
  const { destination, setDestination } = useContext(DestinationContext);
  const { stopover, setStopover } = useContext(StopoverContext);

  useEffect(() => {
    if (type == "source") {
      setPlaceholder("Pickup Location");
    } else if (type === "stop") {
      setPlaceholder("Stopover Location");
    } else {
      setPlaceholder("Dropoff Location");
    }
  }, []);

  const applyPlace = (type, next) => {
    if (type === "source") {
      setSource(next);
    } else if (type === "stop") {
      setStopover((prevStopover) => {
        const updatedStopovers = [...prevStopover];
        updatedStopovers[index] = next;
        return updatedStopovers;
      });
    } else {
      setDestination(next);
    }
  };

  const getLatAndLng = (place, type) => {
    if (!place?.value?.place_id || typeof google === "undefined") return;

    const placeId = place.value.place_id;
    const labelFallback =
      place.label || place.value.description || place.value.structured_formatting?.main_text || "";

    const service = new google.maps.places.PlacesService(
      document.createElement("div"),
    );

    service.getDetails(
      {
        placeId,
        fields: ["geometry", "formatted_address", "name", "place_id"],
      },
      (details, status) => {
        if (status === "OK" && details?.geometry?.location) {
          applyPlace(type, {
            lat: details.geometry.location.lat(),
            lng: details.geometry.location.lng(),
            name: details.formatted_address || labelFallback,
            label: details.name || labelFallback,
          });
          return;
        }

        // Fallback when Places details fails on mobile
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ placeId }, (results, geoStatus) => {
          if (geoStatus === "OK" && results?.[0]?.geometry?.location) {
            const result = results[0];
            applyPlace(type, {
              lat: result.geometry.location.lat(),
              lng: result.geometry.location.lng(),
              name: result.formatted_address || labelFallback,
              label: labelFallback || result.formatted_address,
            });
          }
        });
      },
    );
  };

  const handleClear = () => {
    setValue([]);
    if (type === "source") {
      setSource([]);
    } else if (type === "stop") {
      setStopover((prevStopover) => {
        const updatedStopovers = [...prevStopover];
        updatedStopovers[index] = { lat: null, lng: null, name: "", label: "" };
        return updatedStopovers;
      });
    } else {
      setDestination([]);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode(
          { location: { lat: latitude, lng: longitude } },
          (results, status) => {
            if (status === "OK" && results[0]) {
              const geocodeResult = results[0];

              const placeId = geocodeResult.place_id;
              const service = new google.maps.places.PlacesService(
                document.createElement("div"),
              );

              service.getDetails({ placeId }, (place, placeStatus) => {
                setIsLocating(false);

                if (
                  placeStatus === "OK" &&
                  place.geometry &&
                  place.geometry.location
                ) {
                  setSource({
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                    name: place.formatted_address,
                    label: place.name || place.formatted_address,
                  });

                  setValue({
                    label: place.formatted_address,
                    value: {
                      place_id: place.place_id,
                      description: place.formatted_address,
                    },
                  });
                } else {
                  setSource({
                    lat: latitude,
                    lng: longitude,
                    name: geocodeResult.formatted_address,
                    label: geocodeResult.formatted_address,
                  });

                  setValue({
                    label: geocodeResult.formatted_address,
                    value: {
                      place_id: geocodeResult.place_id,
                      description: geocodeResult.formatted_address,
                    },
                  });
                  setIsLocating(false);
                }
              });
            } else {
              setIsLocating(false);
              alert("Unable to get address from your location");
            }
          },
        );
      },
      (error) => {
        setIsLocating(false);
        alert("Error getting your location: " + error.message);
      },
    );
  };

  return (
    <div className="flex flex-col">
      {type == "source" ? (
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
        <GooglePlacesAutocomplete
          selectProps={{
            value,
            onChange: (place) => {
              getLatAndLng(place, type);
              setValue(place);
            },
            placeholder: placeholder,
            isClearable: true,
            className: "w-[100%]",
            // Portal out of overflow containers so taps work on mobile
            menuPortalTarget:
              typeof document !== "undefined" ? document.body : null,
            menuPosition: "fixed",
            menuShouldScrollIntoView: false,
            components: {
              DropdownIndicator: false,
              ClearIndicator: () => (
                <button
                  type="button"
                  className="pr-2 text-ash transition-colors hover:text-paper"
                  onClick={handleClear}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              ),
            },
            styles: placesStyles,
          }}
        />
        {type == "source" ? (
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="px-3 py-2 text-frost transition-colors hover:text-paper disabled:cursor-not-allowed disabled:opacity-50"
            title="Use my current location"
          >
            {isLocating ? (
              <i className="fa-solid fa-spinner fa-spin"></i>
            ) : (
              <i className="fa-solid fa-location-crosshairs"></i>
            )}
          </button>
        ) : type == "stop" ? (
          <button
            type="button"
            onClick={() => handleTrashClick(index)}
            className="px-2 text-ash transition-colors hover:text-paper"
          >
            <i className="fa-solid fa-trash"></i>
          </button>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}

export default Autocomplete;
