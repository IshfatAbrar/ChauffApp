"use client";
import { DestinationContext } from "@/context/DestinationContext";
import { SourceContext } from "@/context/SourceContext";
import React, { useContext, useEffect, useState } from "react";
import GooglePlacesAutocomplete from "react-google-places-autocomplete";
function Autocomplete(props) {
  const [value, setValue] = useState(null);
  const [placeholder, setPlaceholder] = useState(null);
  const { source, setSource } = useContext(SourceContext);
  const { destination, setDestination } = useContext(DestinationContext);
  const type = props.type;

  useEffect(() => {
    if (type == "source") {
      setPlaceholder("Pickup Location");
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
        console.log(place.geometry.location.lng());
        if (type == "source") {
          setSource({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            name: place.formatted_address,
            label: place.name,
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
    } else {
      setDestination([]); // Clear the destination
    }
  };

  return (
    <div className="flex flex-col">
      {type == "source" ? <label>Where From?</label> : <label>Where To?</label>}
      <div className="bg-slate-100 rounded-md">
        <GooglePlacesAutocomplete
          selectProps={{
            value,
            onChange: (place) => {
              getLatAndLng(place, type);
              setValue(place);
            },
            placeholder: placeholder,
            isClearable: true,
            className: "w-full",
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
                background: "#00ffff00",
                border: "none",
                ":hover": {
                  border: "none",
                },
              }),
              input: (provided, state) => ({
                ...provided,
                border: state.isFocused ? "none" : provided.border,
                outline: state.isFocused ? "none" : provided.outline,
              }),
            },
          }}
        />
      </div>
    </div>
  );
}

export default Autocomplete;
