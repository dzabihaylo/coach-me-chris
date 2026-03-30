"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Trash2, UserPlus, Shield, User } from "lucide-react";

interface AllowedEntry {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  addedBy: string | null;
  lastLoginAt: string | null;
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

  useEffect(() => { fetchEntries(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/whitelist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail, role: newRole }),
    });
    if (!res.ok) { const data = await res.json(); setError(data.error); return; }
    setNewEmail(""); setNewRole("user"); fetchEntries();
  }

  async function handleRemove(email: string) {
    if (!confirm(`Remove ${email} from the whitelist?`)) return;
    const res = await fetch("/api/admin/whitelist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) { const data = await res.json(); setError(data.error); return; }
    fetchEntries();
  }

  return (
    <div className="min-h-screen bg-page text-[var(--text-primary)] p-6">
      <div className="max-w-2xl mx-auto animate-fade-up">
        <a href="/" className="inline-flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-sm mb-8">
          <ArrowLeft size={14} /> Back to app
        </a>

        <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1">Access Management</h1>
        <p className="text-[var(--text-muted)] text-sm mb-6">
          Manage who can sign in to Coach Chris. Only whitelisted emails receive magic links.
        </p>

        {/* Add form */}
        <form onSubmit={handleAdd} className="flex gap-2 mb-6">
          <input
            type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
            placeholder="email@example.com"
            className="flex-1 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)]"
          />
          <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
            className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)]">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-1.5">
            <UserPlus size={14} /> Add
          </button>
        </form>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm mb-4">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-[var(--text-faint)] text-sm text-center py-8">No entries yet.</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div key={entry.id}
                className="flex items-center justify-between glass rounded-xl px-5 py-4">
                <div className="flex items-center gap-3.5">
                  {entry.role === "admin" ? (
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Shield size={15} className="text-amber-400" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center">
                      <User size={15} className="text-[var(--text-faint)]" />
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-[var(--text-primary)] font-medium">{entry.email}</div>
                    <div className="text-xs text-[var(--text-faint)] mt-0.5">
                      {entry.role} · added {new Date(entry.createdAt).toLocaleDateString()}
                      {entry.addedBy && ` by ${entry.addedBy}`}
                    </div>
                    <div className="text-xs text-[var(--text-faint)]">
                      {entry.lastLoginAt
                        ? `Last login: ${new Date(entry.lastLoginAt).toLocaleString()}`
                        : "Never logged in"}
                    </div>
                  </div>
                </div>
                {entry.email !== adminEmail.toLowerCase() && (
                  <button onClick={() => handleRemove(entry.email)}
                    className="text-[var(--text-faint)] hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
                    title="Remove">
                    <Trash2 size={15} />
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
