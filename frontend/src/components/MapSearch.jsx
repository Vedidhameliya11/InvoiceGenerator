import { useState } from "react";
import { useMap } from "react-leaflet";

export default function MapSearch({ onSelect }) {
  const map = useMap();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  // Search while typing
  const handleSearch = async (value) => {
    setQuery(value);

    if (value.length < 3) {
      setResults([]);
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          value
        )}&limit=5`
      );

      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.log(err);
    }
  };

  // Move map when user selects a location
  const chooseLocation = (place) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);

    map.flyTo([lat, lng], 17, {
      duration: 1.5,
    });

    if (onSelect) {
      onSelect({ lat, lng, address: place.display_name });
    }

    setQuery(place.display_name);
    setResults([]);
  };

  // Stop Enter from submitting the outer registration form;
  // pick the top suggestion instead, like Google Maps does.
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (results.length > 0) {
        chooseLocation(results[0]);
      }
    }
  };

  return (
    <div className="search-container">
      <input
        type="text"
        placeholder="Search shop location..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        className="search-input"
      />

      {results.length > 0 && (
        <div className="search-results">
          {results.map((item) => (
            <div
              key={item.place_id}
              className="search-item"
              onClick={() => chooseLocation(item)}
            >
              {item.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}