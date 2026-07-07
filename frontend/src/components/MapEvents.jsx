import { useEffect } from "react";
import { useMap } from "react-leaflet";

export default function MapEvents({ setLocation }) {
  const map = useMap();

  useEffect(() => {
    const updateCenter = () => {
      const center = map.getCenter();
      setLocation({ lat: center.lat, lng: center.lng });
    };

    map.on("moveend", updateCenter);

    return () => {
      map.off("moveend", updateCenter);
    };
  }, [map, setLocation]);

  return null;
}