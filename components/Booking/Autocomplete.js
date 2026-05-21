"use client";

import { DestinationContext } from "../../context/DestinationContext";
import { SourceContext } from "../../context/SourceContext";
import { StopoverContext } from "../../context/StopoverContext";
import React, { useContext, useEffect, useState } from "react";
import GooglePlacesAutocomplete from "react-google-places-autocomplete";

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

  const getLatAndLng = (place, type) => {
    const placeId = place.value.place_id;
    const service = new google.maps.places.PlacesService(
      document.createElement("div"),
    );
    service.getDetails({ placeId }, (place, status) => {
      if (status === "OK" && place.geometry && place.geometry.location) {
        console.log(place);
        if (type == "source") {
          setSource({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            name: place.formatted_address,
            label: place.name,
          });
        } else if (type == "stop") {
          setStopover((prevStopover) => {
            const updatedStopovers = [...prevStopover];
            updatedStopovers[index] = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              name: place.formatted_address,
              label: place.name,
            };
            return updatedStopovers;
          });
        } else {
          console.log("dropoff");
          setDestination({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            name: place.formatted_address,
            label: place.name,
          });
        }
      }
    });
  };

  const handleClear = () => {
    setValue([]); // Clear the value
    if (type === "source") {
      setSource([]); // Clear the source
    } else if (type === "stop") {
      setStopover((prevStopover) => {
        const updatedStopovers = [...prevStopover];
        updatedStopovers[index] = { lat: null, lng: null, name: "", label: "" };
        return updatedStopovers;
      });
    } else {
      setDestination([]); // Clear the destination
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

        // Use Geocoding service to get address from coordinates
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode(
          { location: { lat: latitude, lng: longitude } },
          (results, status) => {
            if (status === "OK" && results[0]) {
              const geocodeResult = results[0];

              // Use Place Details API to get full place information
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
                  // Set source with location data
                  setSource({
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                    name: place.formatted_address,
                    label: place.name || place.formatted_address,
                  });

                  // Update the autocomplete input value to match GooglePlacesAutocomplete format
                  setValue({
                    label: place.formatted_address,
                    value: {
                      place_id: place.place_id,
                      description: place.formatted_address,
                    },
                  });
                } else {
                  // Fallback: use geocoding result directly
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
        <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-1">Where From?</label>
      ) : type === "stop" ? (
        <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-1">Stopover</label>
      ) : (
        <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-1">Where To?</label>
      )}
      <div className="flex flex-row items-center border border-slate-200 bg-white pr-2 rounded-xl shadow-sm">
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
            components: {
              DropdownIndicator: false,
              ClearIndicator: () => (
                <button className=" pr-2" onClick={handleClear}>
                  <i class="fa-solid fa-xmark"></i>
                </button>
              ),
            },
            styles: {
              control: (provided) => ({
                ...provided,
                background: "white",
                border: "none",
                ":hover": {
                  border: "none",
                },
                boxShadow: "none",
                cursor: "text",
              }),
              input: (provided, state) => ({
                ...provided,

                outline: "none",
              }),
            },
          }}
        />
        {type == "source" ? (
          <button
            onClick={handleLocateMe}
            disabled={isLocating}
            className="px-3 py-2 text-slate-600 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
            title="Use my current location"
          >
            {isLocating ? (
              <i className="fa-solid fa-spinner fa-spin"></i>
            ) : (
              <i className="fa-solid fa-location-crosshairs"></i>
            )}
          </button>
        ) : type == "stop" ? (
          <button onClick={() => handleTrashClick(index)}>
            <i className="fa-solid fa-trash text-slate-300"></i>
          </button>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}

export default Autocomplete;
