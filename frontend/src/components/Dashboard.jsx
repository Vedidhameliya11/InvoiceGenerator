import { useState } from "react";

import Sidebar from "./Sidebar";
import DashboardHome from "./DashboardHome";
import AddInvoice from "./AddInvoice";
import History from "./History";
import Templates from "./Templates";
import ManageShops from "./ManageShops";
import EditProfile from "./EditProfile";

import "./Dashboard.css";

export default function Dashboard({ onLogout, role = "user", shopUser = null, onShopUpdated }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showProfile, setShowProfile] = useState(false);

  const isAdmin = role === "admin";

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={role} />

      <div className="dashboard-main">
        <div className="dashboard-topbar">
          <div />
          <div className="topbar-actions">
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
          {activeTab === "dashboard" && <DashboardHome />}
          {!isAdmin && activeTab === "add" && <AddInvoice />}
          {!isAdmin && activeTab === "history" && <History />}
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