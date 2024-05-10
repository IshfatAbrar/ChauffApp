"use client";
import React, { useContext, useEffect, useState } from "react";
import {
  DirectionsRenderer,
  GoogleMap,
  MarkerF,
  OverlayView,
  OverlayViewF,
  useJsApiLoader,
} from "@react-google-maps/api";
import { SourceContext } from "@/context/SourceContext";
import { DestinationContext } from "@/context/DestinationContext";
import { StopoverContext } from "@/context/StopoverContext";

function Map() {
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768); // Assuming small screen width is less than 768px

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768); // Update state based on screen width
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Set initial screen size

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const mapHeight = isSmallScreen ? window.innerHeight / 2 : window.innerHeight; // Adjust height based on screen size

  const containerStyle = {
    width: "100%",
    height: mapHeight,
  };

  const { source, setSource } = useContext(SourceContext);
  const { destination, setDestination } = useContext(DestinationContext);
  const { stopover, setStopover } = useContext(StopoverContext);

  const [center, setCenter] = useState({
    lat: -3.745,
    lng: -38.523,
  });
  const [map, setMap] = React.useState(null);
  const [directionRoutePoints, setDirectionRoutePoints] = useState([]);

  useEffect(() => {
    if (source.length != [] && map) {
      map.panTo({
        lat: source.lat,
        lng: source.lng,
      });
      setCenter({
        lat: source.lat,
        lng: source.lng,
      });
    }
    if (source.length != [] && destination.length != []) {
      directionRoute();
    }
  }, [source, stopover]); // Add map to the dependency array

  useEffect(() => {
    if (destination.length != [] && map) {
      setCenter({
        lat: destination.lat,
        lng: destination.lng,
      });
    }

    if (source && destination) {
      console.log("DIE");
      directionRoute();
    }
  }, [destination, stopover]); // Add map to the dependency array

  useEffect(() => {
    if (stopover.length != [] && map) {
      directionRoute();
    }
  }, [source, destination, stopover]); // Add stopover to the dependency array

  const directionRoute = () => {
    const DirectionsService = new google.maps.DirectionsService();
    console.log("DIE");

    if (stopover.length == []) {
      DirectionsService.route(
        {
          origin: { lat: source.lat, lng: source.lng },
          destination: { lat: destination.lat, lng: destination.lng },
          travelMode: google.maps.TravelMode.DRIVING,
          provideRouteAlternatives: true,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            setDirectionRoutePoints(result);
          } else {
            console.error("Error");
          }
        }
      );
    } else {
      // If there are stopovers, construct waypoints array
      const waypoints = stopover.map((stop) => ({
        location: { lat: stop.lat, lng: stop.lng },
      }));

      console.log(waypoints);

      // Calculate route with waypoints
      DirectionsService.route(
        {
          origin: { lat: source.lat, lng: source.lng },
          destination: { lat: destination.lat, lng: destination.lng },
          waypoints: waypoints,
          travelMode: google.maps.TravelMode.DRIVING,
          provideRouteAlternatives: true,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            setDirectionRoutePoints(result);
          } else {
            console.error("Error calculating directions:", status);
          }
        }
      );
    }
  };

  console.log(stopover);

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={11}
      onLoad={(map) => setMap(map)}
      options={{ mapId: "ad0f5a1927c33023", mapTypeControl: false }}
    >
      {source.length != [] ? (
        <MarkerF
          position={{ lat: source.lat, lng: source.lng }}
          icon={{
            url: "/placeholder.png",
            scaledSize: {
              width: 30,
              height: 30,
            },
          }}
        >
          <OverlayViewF
            position={{ lat: source.lat, lng: source.lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div className="p-1 bg-white font-semibold shadow-lg inline-block">
              <p className="text-black font-mono text-[18px]">{source.label}</p>
            </div>
          </OverlayViewF>
        </MarkerF>
      ) : null}

      {destination.length != [] ? (
        <MarkerF
          position={{ lat: destination.lat, lng: destination.lng }}
          icon={{
            url: "/placeholder.png",
            scaledSize: {
              width: 30,
              height: 30,
            },
          }}
        >
          <OverlayViewF
            position={{ lat: destination.lat, lng: destination.lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div className="p-1 bg-white font-semibold shadow-lg inline-block">
              <p className="text-black font-mono text-[18px]">
                {destination.label}
              </p>
            </div>
          </OverlayViewF>
        </MarkerF>
      ) : null}

      {stopover.length > 0
        ? stopover.map((stop, index) => (
            <MarkerF
              key={index}
              position={{ lat: stop.lat, lng: stop.lng }}
              icon={{
                url: "/placeholder.png",
                scaledSize: {
                  width: 15,
                  height: 15,
                },
              }}
            >
              <OverlayViewF
                position={{ lat: stop.lat, lng: stop.lng }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div className="p-1 bg-white font-semibold shadow-lg inline-block">
                  <p className="text-black font-mono text-[18px]">
                    {stop.label}
                  </p>
                </div>
              </OverlayViewF>
            </MarkerF>
          ))
        : null}

      {source.length !== 0 && destination.length !== 0 && (
        <DirectionsRenderer
          directions={directionRoutePoints}
          options={{
            polylineOptions: {
              strokeColor: "#000",
              strokeWeight: 4,
            },
            suppressMarkers: true,
          }}
        />
      )}
    </GoogleMap>
  );
}

export default Map;
