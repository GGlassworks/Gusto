import { useState } from "react";

export default function AdminDashboard() {
  const [view, setView] = useState("leads");
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Glaze Glassworks Admin Dashboard</h1>
      <div className="flex gap-4 mb-8">
        <button className="btn" onClick={() => setView("leads")}>Leads</button>
        <button className="btn" onClick={() => setView("analytics")}>Analytics</button>
        <button className="btn" onClick={() => setView("users")}>Users</button>
        <button className="btn" onClick={() => setView("logs")}>Audit Logs</button>
      </div>
      <div>
        {view === "leads" && <div>Leads management coming soon…</div>}
        {view === "analytics" && <div>Pipeline analytics coming soon…</div>}
        {view === "users" && <div>User access control coming soon…</div>}
        {view === "logs" && <div>Audit logs coming soon…</div>}
      </div>
    </div>
  );
}
