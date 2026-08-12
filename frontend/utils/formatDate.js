// Always render timestamps in India Standard Time, regardless of the
// browser/device's own timezone (e.g. an admin's laptop set to UTC or a
// server in another region). The backend stores generatedAt in UTC, so we
// explicitly convert it here instead of relying on the browser's locale.

export function formatToIST(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }) + " IST";
}
