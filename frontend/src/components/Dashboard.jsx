import { useState } from "react";

import Sidebar from "./Sidebar";
import DashboardHome from "./DashboardHome";
import AddInvoice from "./AddInvoice";
import History from "./History";
import Products from "./Products";
import Templates from "./Templates";
import ManageShops from "./ManageShops";
import EditProfile from "./EditProfile";
import NotificationBell from "./NotificationBell";

import "./Dashboard.css";

export default function Dashboard({ onLogout, role = "user", shopUser = null, onShopUpdated }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showProfile, setShowProfile] = useState(false);

  const isAdmin = role === "admin";

  // The sidebar has a "profile" item, but Edit Profile is a modal, not a
  // page — so intercept that one tab and open the modal instead of
  // switching to a tab that dashboard-content has nothing to render for.
  const handleTabChange = (tab) => {
    if (tab === "profile") {
      setShowProfile(true);
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} role={role} />

      <div className="dashboard-main">
        <div className="dashboard-topbar">
          <div />
          <div className="topbar-actions">
            {isAdmin && <NotificationBell />}
            {!isAdmin && (
              <button
                type="button"
                className="profile-btn"
                title="Edit Profile"
                onClick={() => setShowProfile(true)}
              >
                👤 Profile
              </button>
            )}
            <button className="logout-btn" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>

        <div className="dashboard-content">
          {activeTab === "dashboard" && <DashboardHome role={role} shopUser={shopUser} />}
          {!isAdmin && activeTab === "add" && <AddInvoice />}
          {!isAdmin && activeTab === "history" && <History />}
          {!isAdmin && activeTab === "products" && <Products />}
          {activeTab === "templates" && <Templates />}
          {isAdmin && activeTab === "shops" && <ManageShops />}
        </div>
      </div>

      {showProfile && !isAdmin && (
        <EditProfile
          shop={shopUser}
          onClose={() => setShowProfile(false)}
          onUpdated={(updated) => {
            if (onShopUpdated) onShopUpdated(updated);
          }}
        />
      )}
    </div>
  );
}