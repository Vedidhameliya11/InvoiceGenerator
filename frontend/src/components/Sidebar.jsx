import "./Sidebar.css";

const ALL_MENU_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "add", label: "Add Invoice", icon: "🧾" },
  { key: "history", label: "History", icon: "🕒" },
  { key: "templates", label: "Templates", icon: "📄" },
  { key: "shops", label: "Manage Shops", icon: "🏬" },
];

// Admin manages the platform: overview, shop onboarding/approval, and
// templates. Regular shop users create/track their own invoices.
const ROLE_MENUS = {
  admin: ["dashboard", "shops", "templates"],
  user: ["dashboard", "add", "history", "templates"],
};

export default function Sidebar({ activeTab, setActiveTab, role }) {
  const allowedKeys = ROLE_MENUS[role] || ROLE_MENUS.user;
  const menuItems = ALL_MENU_ITEMS.filter((item) => allowedKeys.includes(item.key));

  return (
    <div className="sidebar">
      <div className="sidebar-logo">Invoice App</div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <button
            key={item.key}
            className={`sidebar-item ${
              activeTab === item.key ? "active" : ""
            }`}
            onClick={() => setActiveTab(item.key)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
