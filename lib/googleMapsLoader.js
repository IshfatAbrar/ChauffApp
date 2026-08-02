/** Stable shared options for @react-google-maps/api useJsApiLoader. */
export const GOOGLE_MAPS_LIBRARIES = ["places"];

export const googleMapsLoaderOptions = {
  id: "chauff-google-maps",
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",
  libraries: GOOGLE_MAPS_LIBRARIES,
};
