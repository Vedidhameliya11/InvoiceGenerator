import { useEffect } from "react";
import { useMap } from "react-leaflet";

// react-leaflet v5's `whenReady` prop no longer passes the map instance,
// so size fixes must go through the useMap() hook instead.
export default function MapResize() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => clearTimeout(timer);
  }, [map]);

  return null;
}