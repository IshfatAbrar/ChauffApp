"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import HomeNavbar from "../../../components/Home/HomeNavbar";

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

export default function AdminWaitlistPage() {
  const { status } = useSession();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/waitlist");
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "Unable to load waitlist.");
        setEntries([]);
        return;
      }
      setEntries(data.entries || []);
    } catch {
      setError("Unable to load waitlist.");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      loadEntries();
    }
  }, [status, loadEntries]);

  return (
    <main className="min-h-screen bg-void font-display text-paper">
      <HomeNavbar />

      <section className="px-6 pb-10 pt-atlas-48 md:px-10 md:pt-atlas-64">
        <div className="mx-auto max-w-[1100px]">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-ash">
            Admin
          </p>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-instrument text-[40px] font-normal leading-[1.05] tracking-[-0.02em] text-paper md:text-[56px]">
                Waitlist
              </h1>
              <p className="mt-3 max-w-[36rem] font-display text-[16px] leading-[1.55] text-ash">
                {entries.length} email{entries.length === 1 ? "" : "s"} on the
                waitlist.
              </p>
            </div>
            <button
              type="button"
              onClick={loadEntries}
              className="rounded-full bg-paper px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-black transition-opacity hover:opacity-85"
            >
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="px-6 pb-atlas-128 md:px-10">
        <div className="mx-auto max-w-[1100px] overflow-hidden rounded-[24px] border border-white/10 bg-obsidian">
          {loading ? (
            <p className="p-8 font-mono text-[13px] text-ash">Loading…</p>
          ) : error ? (
            <p className="p-8 font-mono text-[13px] text-red-400">{error}</p>
          ) : entries.length === 0 ? (
            <p className="p-8 font-mono text-[13px] text-ash">
              No waitlist entries yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="border-b border-white/10">
                  <tr className="font-mono text-[10px] uppercase tracking-[0.16em] text-ash">
                    <th className="px-5 py-4 font-normal">Email</th>
                    <th className="px-5 py-4 font-normal">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-white/5 last:border-b-0"
                    >
                      <td className="px-5 py-4 font-body text-[14px] text-paper">
                        {entry.email}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-mono text-[12px] text-ash">
                        {formatDate(entry.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
