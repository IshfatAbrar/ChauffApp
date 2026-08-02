"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import FleetPageHeader from "../../../components/Fleet/FleetPageHeader";

export default function FleetDriversPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [driverPayouts, setDriverPayouts] = useState({});
  const [payingDriver, setPayingDriver] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin?callbackUrl=/partner/drivers");
    } else if (status === "authenticated" && session?.user?.role !== "fleet") {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "fleet") {
      fetchDrivers();
    }
  }, [status, session]);

  useEffect(() => {
    if (drivers.length > 0) {
      drivers.forEach((driver) => {
        calculateDriverPayout(driver._id);
      });
    }
  }, [drivers]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/fleet/drivers");
      if (!response.ok) throw new Error("Failed to fetch drivers");
      const data = await response.json();
      setDrivers(data.drivers || []);
    } catch (err) {
      console.error("Error fetching drivers:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredDrivers = drivers.filter((driver) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      driver.name?.toLowerCase().includes(q) ||
      driver.email?.toLowerCase().includes(q) ||
      driver.phone?.includes(searchTerm) ||
      driver.licenseNumber?.toLowerCase().includes(q);

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && driver.isActive) ||
      (filterStatus === "inactive" && !driver.isActive);

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount || 0);

  const calculateDriverPayout = async (driverId) => {
    setDriverPayouts((prev) => ({
      ...prev,
      [driverId]: { ...prev[driverId], loading: true, error: null },
    }));

    try {
      const response = await fetch("/api/fleet/drivers/calculate-payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setDriverPayouts((prev) => ({
          ...prev,
          [driverId]: {
            totalDue: data.totalDue,
            unpaidBookingsCount: data.unpaidBookingsCount,
            hasBankDetails: data.hasBankDetails,
            loading: false,
            error: null,
          },
        }));
      } else {
        setDriverPayouts((prev) => ({
          ...prev,
          [driverId]: {
            loading: false,
            error: data.message || "Failed to calculate payout",
          },
        }));
      }
    } catch (error) {
      setDriverPayouts((prev) => ({
        ...prev,
        [driverId]: { loading: false, error: error.message },
      }));
    }
  };

  const handlePayDriver = async (driverId, amount) => {
    if (!confirm(`Pay $${amount.toFixed(2)} to this driver?`)) return;
    setPayingDriver(driverId);
    try {
      const response = await fetch("/api/fleet/drivers/pay-driver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId, amount }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        alert(data.message);
        await calculateDriverPayout(driverId);
        await fetchDrivers();
      } else {
        alert(data.message || "Failed to process payment");
      }
    } catch (error) {
      console.error("Error paying driver:", error);
      alert("An error occurred while processing payment");
    } finally {
      setPayingDriver(null);
    }
  };

  const activeCount = drivers.filter((d) => d.isActive).length;
  const filters = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "inactive", label: "Inactive" },
  ];

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-void">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-fleet-border border-t-paper" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-void pb-16 text-paper md:pb-20">
      <div className="mx-auto max-w-6xl px-6 pt-8 md:px-8 md:pt-10">
        <FleetPageHeader
          title="Drivers"
          description="Your chauffeurs, payouts, and status — solo or team."
        />

        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-fleet-border bg-obsidian p-5">
            <p className="font-body text-[13px] text-ash">Total</p>
            <p className="mt-1 font-body text-[28px] font-medium text-paper">
              {drivers.length}
            </p>
          </div>
          <div className="rounded-2xl border border-fleet-border bg-obsidian p-5">
            <p className="font-body text-[13px] text-ash">Active</p>
            <p className="mt-1 font-body text-[28px] font-medium text-paper">
              {activeCount}
            </p>
          </div>
          <div className="col-span-2 rounded-2xl border border-fleet-border bg-obsidian p-5 sm:col-span-1">
            <p className="font-body text-[13px] text-ash">Verified</p>
            <p className="mt-1 font-body text-[28px] font-medium text-paper">
              {drivers.filter((d) => d.isVerified).length}
            </p>
          </div>
        </section>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Search drivers…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full flex-1 rounded-full border border-fleet-border bg-obsidian px-4 py-2.5 font-body text-[14px] text-paper placeholder:text-ash focus:border-fleet-border-strong focus:outline-none"
          />
          <div className="flex gap-1 rounded-full border border-fleet-border bg-obsidian p-1">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterStatus(f.id)}
                className={`rounded-full px-4 py-2 font-body text-[13px] transition-colors ${
                  filterStatus === f.id
                    ? "bg-paper text-fleet-on-paper"
                    : "text-ash hover:text-paper"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 font-body text-[14px] text-red-300">
            {error}
          </p>
        )}

        {filteredDrivers.length === 0 ? (
          <div className="rounded-2xl border border-fleet-border bg-obsidian px-5 py-12 text-center font-body text-[14px] text-ash">
            {searchTerm || filterStatus !== "all" ? (
              "No drivers match your filters."
            ) : (
              <div className="mx-auto max-w-md space-y-2">
                <p>
                  No chauffeurs linked yet. Solo partners: create or join as a
                  driver in the chauffeur app using this partner account.
                </p>
                {session?.user?.id && (
                  <p className="font-mono text-[12px] text-frost">
                    Partner ID: {session.user.id}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-fleet-border bg-obsidian">
            {filteredDrivers.map((driver) => {
              const payout = driverPayouts[driver._id];
              const open = expandedId === driver._id;
              const due = payout?.totalDue || 0;

              return (
                <li
                  key={driver._id}
                  className="border-b border-fleet-border last:border-0"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(open ? null : driver._id)
                    }
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-fleet-hover md:px-6"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-graphite font-body text-[14px] text-frost">
                      {(driver.name || "?").charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-body text-[15px] font-medium text-paper">
                          {driver.name}
                        </p>
                        <span className="font-body text-[12px] text-ash">
                          {driver.isActive ? "Active" : "Inactive"}
                          {driver.isVerified ? " · Verified" : ""}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate font-body text-[13px] text-ash">
                        {driver.email}
                        {driver.phone ? ` · ${driver.phone}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-body text-[14px] text-paper tabular-nums">
                        {payout?.loading ? "…" : formatCurrency(due)}
                      </p>
                      <p className="mt-0.5 font-body text-[12px] text-ash">
                        due
                      </p>
                    </div>
                    <i
                      className={`fa-solid fa-chevron-down text-[11px] text-ash transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {open && (
                    <div className="space-y-4 border-t border-fleet-border bg-void/40 px-5 py-5 md:px-6">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="font-body text-[12px] text-ash">License</p>
                          <p className="mt-1 font-body text-[14px] text-paper">
                            {driver.licenseNumber || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="font-body text-[12px] text-ash">Vehicle</p>
                          <p className="mt-1 font-body text-[14px] text-paper">
                            {driver.vehicleDetails?.make
                              ? [
                                  driver.vehicleDetails.year,
                                  driver.vehicleDetails.make,
                                  driver.vehicleDetails.model,
                                ]
                                  .filter(Boolean)
                                  .join(" ")
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="font-body text-[12px] text-ash">
                            Completed trips
                          </p>
                          <p className="mt-1 font-body text-[14px] text-paper">
                            {driver.stats?.completedTrips || 0}
                          </p>
                        </div>
                        <div>
                          <p className="font-body text-[12px] text-ash">
                            Unpaid rides
                          </p>
                          <p className="mt-1 font-body text-[14px] text-paper">
                            {payout?.unpaidBookingsCount || 0}
                          </p>
                        </div>
                      </div>

                      {payout?.error && (
                        <p className="font-body text-[13px] text-red-300">
                          {payout.error}
                        </p>
                      )}

                      {due > 0 && (
                        <button
                          type="button"
                          onClick={() => handlePayDriver(driver._id, due)}
                          disabled={
                            payingDriver === driver._id ||
                            !payout?.hasBankDetails
                          }
                          className="inline-flex items-center justify-center rounded-full bg-paper px-5 py-2.5 font-body text-[13px] text-fleet-on-paper transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {payingDriver === driver._id
                            ? "Processing…"
                            : !payout?.hasBankDetails
                              ? "Bank details required"
                              : `Pay ${formatCurrency(due)}`}
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
