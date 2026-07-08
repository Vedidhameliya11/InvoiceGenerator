import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import MapSearch from "./MapSearch";
import MapEvents from "./MapEvents";
import MapResize from "./MapResize";

import "./Register.css";


export default function Register({ onRegister, onLoginClick }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    shopName: "",
    address: "",
  });

  const [location, setLocation] = useState({
    lat: 21.1702,
    lng: 72.8311,
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.contact ||
      !formData.shopName ||
      !formData.address
    ) {
      alert("Please fill all fields.");
      return;
    }

    setSubmitting(true);

    try {
      await axios.post(`${API_BASE}/register`, {
        owner_name: formData.name,
        email: formData.email,
        contact_no: formData.contact,
        shop_name: formData.shopName,
        shop_address: formData.address,
      });

      // Keep a local copy too, so PendingApproval / other screens can
      // still read basic shop info before the admin approves.
      localStorage.setItem(
        "shop",
        JSON.stringify({
          ...formData,
          location,
        })
      );

      if (onRegister) onRegister(true);
    } catch (err) {
      console.error("Registration failed:", err);
      alert(
        err.response?.data?.detail ||
          "Could not submit registration. Check that the backend server is running."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-box">

        <h2>Registration</h2>

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            name="name"
            placeholder="Owner Name"
            value={formData.name}
            onChange={handleChange}
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />

          <input
            type="text"
            name="contact"
            placeholder="Contact Number"
            value={formData.contact}
            onChange={handleChange}
          />

          <input
            type="text"
            name="shopName"
            placeholder="Shop Name"
            value={formData.shopName}
            onChange={handleChange}
          />

          <input
            type="text"
            name="address"
            placeholder="Shop Address"
            value={formData.address}
            onChange={handleChange}
          />

          <div className="map-container">

            <MapContainer
              center={[location.lat, location.lng]}
              zoom={15}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapResize />

              <MapSearch
                onSelect={({ lat, lng }) => setLocation({ lat, lng })}
              />

              <MapEvents setLocation={setLocation} />

              <MapEvents
                setLocation={setLocation}
                setAddress={(address) =>
                  setFormData((prev) => ({
                    ...prev,
                    address,
                  }))
                }
              />
            </MapContainer>

            <div className="center-pin">
              <svg
                width="36"
                height="46"
                viewBox="0 0 36 46"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.06 27.94 0 18 0z"
                  fill="#EC4899"
                />
                <circle cx="18" cy="18" r="7" fill="#ffffff" />
              </svg>
            </div>

          </div>

          <button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Register"}
          </button>

        </form>

        <div className="login-row">
          <span>Already have an account?</span>
          <button
            type="button"
            className="login-link-btn"
            onClick={onLoginClick}
          >
            Login
          </button>
        </div>

      </div>
    </div>
  );
}