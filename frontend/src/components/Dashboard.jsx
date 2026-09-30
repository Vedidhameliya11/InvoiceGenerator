import { useState } from "react";

import Sidebar from "./Sidebar";
import DashboardHome from "./DashboardHome";
import AddInvoice from "./AddInvoice";
import History from "./History";
import Products from "./Products";
import Templates from "./Templates";
import ManageShops from "./ManageShops";
import EditProfile from "./EditProfile";
import ViewProfile from "./ViewProfile";
import ChangePassword from "./ChangePassword";
import NotificationBell from "./NotificationBell";
import Announcements from "./Announcements";
import ShopUpdatesBell from "./ShopUpdatesBell";

import "./Dashboard.css";

export default function Dashboard({ onLogout, role = "user", shopUser = null, onShopUpdated }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  // Sidebar "Edit Profile" opens the editable form directly.
  // Topbar profile icon (next to Logout) opens a read-only view first,
  // which itself has an "Edit Profile" button that hands off to the form.
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showViewProfile, setShowViewProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const isAdmin = role === "admin";

  // The sidebar has a "profile" item and a "password" item, but Edit Profile
  // and Change Password are modals, not pages — so intercept those tabs
  // and open the respective modal instead of switching to a non-existent tab.
  const handleTabChange = (tab) => {
    if (tab === "profile") {
      setShowEditProfile(true);
      return;
    }
    if (tab === "password") {
      setShowChangePassword(true);
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
            {!isAdmin && <ShopUpdatesBell shopId={shopUser?.id} />}
            {!isAdmin && (
              <button
                type="button"
                className="profile-btn"
                title="My Profile"
                onClick={() => setShowViewProfile(true)}
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
          {isAdmin && activeTab === "announcements" && <Announcements />}
        </div>
      </div>

      {showViewProfile && !isAdmin && (
        <ViewProfile
          shop={shopUser}
          onClose={() => setShowViewProfile(false)}
          onEdit={() => {
            setShowViewProfile(false);
            setShowEditProfile(true);
          }}
          onChangePassword={() => {
            setShowViewProfile(false);
            setShowChangePassword(true);
          }}
        />
      )}

      {showEditProfile && !isAdmin && (
        <EditProfile
          shop={shopUser}
          onClose={() => setShowEditProfile(false)}
          onUpdated={(updated) => {
            if (onShopUpdated) onShopUpdated(updated);
          }}
          onChangePassword={() => {
            setShowEditProfile(false);
            setShowChangePassword(true);
          }}
        />
      )}

      {showChangePassword && !isAdmin && (
        <ChangePassword
          shop={shopUser}
          onClose={() => setShowChangePassword(false)}
        />
      )}
    </div>
  );
}