"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Trash2, UserPlus, Shield, User } from "lucide-react";

interface AllowedEntry {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  addedBy: string | null;
}

export default function AdminPanel({ adminEmail }: { adminEmail: string }) {
  const [entries, setEntries] = useState<AllowedEntry[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchEntries() {
    const res = await fetch("/api/admin/whitelist");
    if (res.ok) {
      const data = await res.json();
      setEntries(data.entries);
    } else {
      setError("Failed to load whitelist");
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchEntries();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/whitelist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail, role: newRole }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      return;
    }
    setNewEmail("");
    setNewRole("user");
    fetchEntries();
  }

  async function handleRemove(email: string) {
    if (!confirm(`Remove ${email} from the whitelist?`)) return;
    const res = await fetch("/api/admin/whitelist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      return;
    }
    fetchEntries();
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-200 p-6">
      <div className="max-w-2xl mx-auto">
        <a
          href="/"
          className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-300 text-sm mb-6"
        >
          <ArrowLeft size={14} /> Back to app
        </a>

        <h1 className="text-xl font-bold text-white mb-1">Access Management</h1>
        <p className="text-gray-500 text-sm mb-6">
          Manage who can sign in to Coach Chris. Only whitelisted emails
          receive magic links.
        </p>

        {/* Add form */}
        <form
          onSubmit={handleAdd}
          className="flex gap-2 mb-6"
        >
          <input
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="email@example.com"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            className="bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5"
          >
            <UserPlus size={14} /> Add
          </button>
        </form>

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-lg px-3 py-2 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        {/* List */}
        {loading ? (
          <p className="text-gray-600 text-sm">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-gray-600 text-sm">No entries yet.</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  {entry.role === "admin" ? (
                    <Shield size={16} className="text-amber-500" />
                  ) : (
                    <User size={16} className="text-gray-500" />
                  )}
                  <div>
                    <div className="text-sm text-white">{entry.email}</div>
                    <div className="text-xs text-gray-600">
                      {entry.role} · added{" "}
                      {new Date(entry.createdAt).toLocaleDateString()}
                      {entry.addedBy && ` by ${entry.addedBy}`}
                    </div>
                  </div>
                </div>
                {entry.email !== adminEmail.toLowerCase() && (
                  <button
                    onClick={() => handleRemove(entry.email)}
                    className="text-gray-600 hover:text-red-400 transition-colors"
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
