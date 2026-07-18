import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import "./NotificationBell.css";

const POLL_MS = 30000; // check for new updates every 30s

function timeAgo(iso) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const TYPE_ICON = {
  new_shop: "🏬",
  new_invoice: "🧾",
  info: "🔔",
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/notifications/unread-count`);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error("Failed to load unread notification count:", err);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/admin/notifications`, {
        params: { limit: 30 },
      });
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // Poll unread count in the background so the badge stays current even
  // when the dropdown is closed.
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  // Close the dropdown when clicking outside it.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchNotifications();
  };

  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await axios.post(`${API_BASE}/admin/notifications/${id}/read`);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await axios.post(`${API_BASE}/admin/notifications/read-all`);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  return (
    <div className="notif-bell-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="notif-bell-btn"
        title="Notifications"
        onClick={toggleOpen}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button type="button" className="notif-mark-all" onClick={markAllRead}>
                Mark all as read
              </button>
            )}
          </div>

          <div className="notif-list">
            {loading ? (
              <p className="notif-empty-msg">Loading…</p>
            ) : notifications.length === 0 ? (
              <p className="notif-empty-msg">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notif-item ${n.read ? "" : "notif-item-unread"}`}
                  onClick={() => !n.read && markAsRead(n.id)}
                >
                  <span className="notif-icon">{TYPE_ICON[n.type] || "🔔"}</span>
                  <div className="notif-item-body">
                    <span className="notif-item-title">{n.title}</span>
                    <span className="notif-item-msg">{n.message}</span>
                    <span className="notif-item-time">{timeAgo(n.created_at)}</span>
                  </div>
                  {!n.read && <span className="notif-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}