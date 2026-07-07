import { useEffect, useState } from "react";
import "./App.css";

import Login from "./components/Login";
import Register from "./components/Register";
import PendingApproval from "./components/PendingApproval";
import Dashboard from "./components/Dashboard";

function App() {
  // If the user already has an active session (e.g. page refresh),
  // skip straight to the dashboard instead of showing Login again.
  const [step, setStep] = useState(() =>
    localStorage.getItem("loggedIn") === "true" ? "dashboard" : "register"
  );

  // 🔒 Trap the browser Back button: once logged in, pressing Back
  // should NOT reveal the Login page again.
  useEffect(() => {
    // Seed a history entry so there's something for "Back" to hit.
    window.history.pushState({ app: true }, "", window.location.href);

    const handlePopState = () => {
      if (localStorage.getItem("loggedIn") === "true") {
        // Cancel the back navigation by pushing forward again.
        window.history.pushState({ app: true }, "", window.location.href);
        setStep("dashboard");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleLoginSuccess = (loginData) => {
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("role", loginData?.role || "user");
    window.history.pushState({ app: true }, "", window.location.href);
    setStep("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("role");
    setStep("register");
  };

  // 🔥 AUTH FLOW CONTROL
  if (step === "login") {
    return (
      <Login
        onLogin={handleLoginSuccess}
        onSignUp={() => setStep("register")}
      />
    );
  }

  if (step === "register") {
    return (
      <Register
        onRegister={() => setStep("pending")}
        onLoginClick={() => setStep("login")}
      />
    );
  }

  if (step === "pending") {
    return <PendingApproval />;
  }

  // 🔥 DEFAULT PAGE AFTER LOGIN
  return (
    <Dashboard
      onLogout={handleLogout}
      role={localStorage.getItem("role") || "user"}
    />
  );
}

export default App;