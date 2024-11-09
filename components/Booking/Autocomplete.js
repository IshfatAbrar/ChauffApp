"use client";

import { DestinationContext } from "../../context/DestinationContext";
import { SourceContext } from "../../context/SourceContext";
import { StopoverContext } from "../../context/StopoverContext";
import React, { useContext, useEffect, useState } from "react";
import GooglePlacesAutocomplete from "react-google-places-autocomplete";

function Autocomplete({ type, index, handleTrashClick }) {
  const [value, setValue] = useState(null);
  const [placeholder, setPlaceholder] = useState(null);
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
      document.createElement("div")
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

  return (
    <div className="flex flex-col">
      {type == "source" ? (
        <label>Where From?</label>
      ) : type === "stop" ? (
        <label>Need to Stop?</label>
      ) : (
        <label>Where To?</label>
      )}
      <div className="flex flex-row items-center border-2 border-slate-300 pr-2 rounded-md">
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
        {type == "stop" ? (
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
