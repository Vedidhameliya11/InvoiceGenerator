import { useState } from "react";

import Sidebar from "./Sidebar";
import DashboardHome from "./DashboardHome";
import AddInvoice from "./AddInvoice";
import History from "./History";
import Templates from "./Templates";
import ManageShops from "./ManageShops";

import "./Dashboard.css";

export default function Dashboard({ onLogout, role = "user" }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  const isAdmin = role === "admin";

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={role} />

      <div className="dashboard-main">
        <div className="dashboard-topbar">
          <div />
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>

        <div className="dashboard-content">
          {activeTab === "dashboard" && <DashboardHome />}
          {!isAdmin && activeTab === "add" && <AddInvoice />}
          {!isAdmin && activeTab === "history" && <History />}
          {activeTab === "templates" && <Templates />}
          {isAdmin && activeTab === "shops" && <ManageShops />}
        </div>
      </div>
    </div>
  );
}
