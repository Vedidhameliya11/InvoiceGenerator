import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import "./NotificationBell.css"; // shares the same dropdown look as the admin bell

const POLL_MS = 30000;

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

export default function ShopUpdatesBell({ shopId }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  const fetchUnreadCount = async () => {
    if (!shopId) return;
    try {
      const res = await axios.get(`${API_BASE}/shop/announcements/unread-count`, {
        params: { shop_id: shopId },
      });
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error("Failed to load unread update count:", err);
    }
  };

  const fetchItems = async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/shop/announcements`, {
        params: { shop_id: shopId, limit: 30 },
      });
      setItems(res.data);
    } catch (err) {
      console.error("Failed to load updates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, POLL_MS);
    return () => clearInterval(interval);
  }, [shopId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (!next || !shopId) return;

    await fetchItems();

    // Opening the tray counts as "seen" — same pattern as most
    // notification bells, so the badge clears once the admin's updates
    // have actually been shown to the shop owner.
    if (unreadCount > 0) {
      setUnreadCount(0);
      try {
        await axios.post(`${API_BASE}/shop/announcements/mark-seen`, null, {
          params: { shop_id: shopId },
        });
      } catch (err) {
        console.error("Failed to mark updates as seen:", err);
      }
    }
  };

  return (
    <div className="notif-bell-wrapper" ref={wrapperRef}>
      <button type="button" className="notif-bell-btn" title="What's New" onClick={toggleOpen}>
        🔔
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <span>What's New</span>
          </div>

          <div className="notif-list">
            {loading ? (
              <p className="notif-empty-msg">Loading…</p>
            ) : items.length === 0 ? (
              <p className="notif-empty-msg">No updates yet.</p>
            ) : (
              items.map((a) => (
                <div
                  key={a.id}
                  className={`notif-item ${a.unread ? "notif-item-unread" : ""}`}
                >
                  <span className="notif-icon">📢</span>
                  <div className="notif-item-body">
                    <span className="notif-item-title">{a.title}</span>
                    <span className="notif-item-msg">{a.message}</span>
                    <span className="notif-item-time">{timeAgo(a.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}