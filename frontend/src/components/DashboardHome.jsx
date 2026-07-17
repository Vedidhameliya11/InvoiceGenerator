import { useEffect, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { API_BASE } from "../config";
import "./DashboardHome.css";

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <span className="stat-card-label">{label}</span>
      <span className="stat-card-value">{value}</span>
    </div>
  );
}

const RANGE_OPTIONS = [7, 14, 30];

export default function DashboardHome({ role = "user", shopUser = null }) {
  const isAdmin = role === "admin";
  const shopId = shopUser?.id;

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rangeDays, setRangeDays] = useState(7); // default 7-day window for admin's daily view

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (isAdmin) {
          const res = await axios.get(`${API_BASE}/admin/invoices/stats`, {
            params: { days: rangeDays },
          });
          setStats(res.data);
        } else {
          if (!shopId) {
            setLoading(false);
            return;
          }
          const res = await axios.get(`${API_BASE}/invoices/stats`, {
            params: { shop_id: shopId },
          });
          setStats(res.data);
        }
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
        setError("Couldn't load dashboard stats. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAdmin, shopId, rangeDays]);

  if (loading) {
    return (
      <div className="dashboard-home">
        <p className="dashboard-home-msg">Loading dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-home">
        <p className="dashboard-home-msg">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard-home">
        <p className="dashboard-home-msg">No dashboard data available yet.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-home">
      {isAdmin && (
        <div className="range-selector">
          <span className="range-selector-label">Show activity for:</span>
          {RANGE_OPTIONS.map((d) => (
            <button
              key={d}
              className={`range-btn ${rangeDays === d ? "range-btn-active" : ""}`}
              onClick={() => setRangeDays(d)}
            >
              Last {d} days
            </button>
          ))}
        </div>
      )}

      <div className="stat-cards">
        {isAdmin ? (
          <>
            <StatCard label="Total Shops" value={stats.total_shops} />
            <StatCard label="Total Invoices (All Shops)" value={stats.total_invoices} />
            <StatCard
              label="Total Revenue (All Shops)"
              value={`₹${stats.total_revenue.toFixed(2)}`}
            />
            <StatCard label="Invoices Today" value={stats.invoices_today} />
            <StatCard
              label={`New Signups (${stats.range_days}d)`}
              value={stats.new_shops_count}
            />
          </>
        ) : (
          <>
            <StatCard label="Total Invoices" value={stats.total_invoices} />
            <StatCard
              label="Total Revenue"
              value={`₹${stats.total_revenue.toFixed(2)}`}
            />
          </>
        )}
      </div>

      {isAdmin ? (
        <>
          <div className="chart-card">
            <h3>Daily Invoices — Last {stats.range_days} Days (All Shops)</h3>
            {stats.daily.every((d) => d.count === 0) ? (
              <p className="dashboard-home-msg">No invoices generated in this period.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.daily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Invoices" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="chart-card">
            <h3>Invoices by Shop</h3>
            {stats.by_shop.length === 0 ? (
              <p className="dashboard-home-msg">No invoices generated yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={stats.by_shop}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="shop_name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Invoices" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="chart-card">
            <h3>Newly Signed-Up Shops (Last {stats.range_days} Days)</h3>
            {stats.new_shops.length === 0 ? (
              <p className="dashboard-home-msg">No new shops have signed up in this period.</p>
            ) : (
              <div className="table-scroll">
                <table className="new-shops-table">
                  <thead>
                    <tr>
                      <th>Shop</th>
                      <th>Owner</th>
                      <th>Signed Up</th>
                      <th>Status</th>
                      <th>Invoices Today</th>
                      <th>Invoices ({stats.range_days}d)</th>
                      <th>Invoices (Total)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.new_shops.map((s) => (
                      <tr key={s.shop_id}>
                        <td>{s.shop_name}</td>
                        <td>{s.owner_name}</td>
                        <td>
                          {new Date(s.signed_up_at).toLocaleDateString(undefined, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td>
                          <span className={`status-pill status-${s.status}`}>
                            {s.status}
                          </span>
                        </td>
                        <td>{s.invoices_today}</td>
                        <td>{s.invoices_in_range}</td>
                        <td>{s.invoices_total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="chart-card">
          <h3>Invoices — Last 6 Months</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={stats.monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                name="Invoices"
                stroke="#2563eb"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}