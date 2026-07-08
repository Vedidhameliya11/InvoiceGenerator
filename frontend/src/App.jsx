import { useEffect, useState } from "react";
import "./App.css";

import Login from "./components/Login";
import Register from "./components/Register";
import PendingApproval from "./components/PendingApproval";
import Dashboard from "./components/Dashboard";

function App() {
  const [step, setStep] = useState(() => {
    if (localStorage.getItem("loggedIn") === "true") return "dashboard";
    if (localStorage.getItem("regPending") === "true") return "pending";
    return "register";
  });

  const [shopUser, setShopUser] = useState(() => {
    const stored = localStorage.getItem("shopUser");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    window.history.pushState({ app: true }, "", window.location.href);

    const handlePopState = () => {
      if (localStorage.getItem("loggedIn") === "true") {
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
    if (loginData?.shop) {
      localStorage.setItem("shopUser", JSON.stringify(loginData.shop));
      setShopUser(loginData.shop);
    }
    localStorage.removeItem("regPending");
    localStorage.removeItem("shop");
    window.history.pushState({ app: true }, "", window.location.href);
    setStep("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("role");
    localStorage.removeItem("shopUser");
    setShopUser(null);
    setStep("login");
  };

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
        onRegister={() => {
          localStorage.setItem("regPending", "true");
          setStep("pending");
        }}
        onLoginClick={() => setStep("login")}
      />
    );
  }

  if (step === "pending") {
    return (
      <PendingApproval
        onBackToLogin={() => {
          localStorage.removeItem("regPending");
          setStep("login");
        }}
      />
    );
  }

  return (
    <Dashboard
      onLogout={handleLogout}
      role={localStorage.getItem("role") || "user"}
      shopUser={shopUser}
      onShopUpdated={(updated) => {
        localStorage.setItem("shopUser", JSON.stringify(updated));
        setShopUser(updated);
      }}
    />
  );
}

export default App;