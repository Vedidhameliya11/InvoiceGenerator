import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import "./Announcements.css";

export default function Announcements() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(`${API_BASE}/admin/announcements`);
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to load announcement history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!title.trim() || !message.trim()) {
      setError("Please fill in both a title and a message.");
      return;
    }

    setSending(true);
    try {
      const res = await axios.post(`${API_BASE}/admin/announcements`, {
        title: title.trim(),
        message: message.trim(),
      });
      setSuccessMsg(
        `Sent to ${res.data.emailed_count} shop owner${
          res.data.emailed_count === 1 ? "" : "s"
        }.`
      );
      setTitle("");
      setMessage("");
      fetchHistory();
    } catch (err) {
      console.error("Failed to send announcement:", err);
      setError("Couldn't send the update. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="announcements-page">
      <div className="announce-form-card">
        <h3>Send an Update to All Shop Owners</h3>
        <p className="announce-hint">
          This emails every approved shop owner and shows up in their own
          dashboard notifications — use it for new features, maintenance
          notices, or anything else they should know about.
        </p>

        <form onSubmit={handleSend}>
          <label className="announce-label">Title</label>
          <input
            type="text"
            className="announce-input"
            placeholder="e.g. New: Bulk invoice export"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label className="announce-label">Message</label>
          <textarea
            className="announce-textarea"
            rows={5}
            placeholder="Describe what's new or what's changing…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          {error && <p className="announce-error">{error}</p>}
          {successMsg && <p className="announce-success">{successMsg}</p>}

          <button type="submit" className="announce-send-btn" disabled={sending}>
            {sending ? "Sending…" : "Send Update"}
          </button>
        </form>
      </div>

      <div className="announce-history-card">
        <h3>Previously Sent</h3>
        {loadingHistory ? (
          <p className="announce-empty-msg">Loading…</p>
        ) : history.length === 0 ? (
          <p className="announce-empty-msg">No updates sent yet.</p>
        ) : (
          <div className="announce-history-list">
            {history.map((a) => (
              <div key={a.id} className="announce-history-item">
                <div className="announce-history-top">
                  <span className="announce-history-title">{a.title}</span>
                  <span className="announce-history-date">
                    {new Date(a.created_at).toLocaleDateString(undefined, {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <p className="announce-history-msg">{a.message}</p>
                <span className="announce-history-meta">
                  Emailed to {a.emailed_count} shop owner
                  {a.emailed_count === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}