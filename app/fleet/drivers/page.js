"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import FleetSubpageHero from "../../../components/Fleet/FleetSubpageHero";

export default function FleetDriversPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, active, inactive
  const [driverPayouts, setDriverPayouts] = useState({}); // { driverId: { totalDue, loading, error } }
  const [payingDriver, setPayingDriver] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin?callbackUrl=/fleet/drivers");
    } else if (status === "authenticated" && session?.user?.role !== "fleet") {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "fleet") {
      fetchDrivers();
    }
  }, [status, session]);

  // Fetch payout amounts for all drivers
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

      if (!response.ok) {
        throw new Error("Failed to fetch drivers");
      }

      const data = await response.json();
      setDrivers(data.drivers || []);
    } catch (err) {
      console.error("Error fetching drivers:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter drivers based on search and status
  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone.includes(searchTerm) ||
      driver.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && driver.isActive) ||
      (filterStatus === "inactive" && !driver.isActive);

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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
        [driverId]: {
          loading: false,
          error: error.message,
        },
      }));
    }
  };

  const handlePayDriver = async (driverId, amount) => {
    if (!confirm(`Pay $${amount.toFixed(2)} to this driver?`)) {
      return;
    }

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
        // Recalculate payout
        await calculateDriverPayout(driverId);
        // Refresh drivers list
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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f8f8] text-slate-900 pt-36 lg:pt-40 pb-16">
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-slate-900" />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f8f8] text-slate-900 pt-36 lg:pt-40 pb-16 md:pb-24">
      <FleetSubpageHero
        eyebrow={
          <>
            Drivers
            <span className="text-slate-300">—</span>
            your team
          </>
        }
        title="Fleet drivers"
        description="Manage and monitor everyone on your fleet — search, filter, and review payouts in one place."
      />

      <div className="border-t border-slate-200" />

      <section className="max-w-7xl mx-auto px-4 pt-10 space-y-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-200">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-2">
              Total
            </div>
            <div className="text-2xl md:text-3xl font-semibold bg-gradient-to-b from-slate-900 to-slate-500 bg-clip-text text-transparent">
              {drivers.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Drivers</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-200">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-2">
              Active
            </div>
            <div className="text-2xl md:text-3xl font-semibold bg-gradient-to-b from-emerald-700 to-emerald-500 bg-clip-text text-transparent">
              {drivers.filter((d) => d.isActive).length}
            </div>
            <p className="text-xs text-slate-500 mt-1">On the road</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-200">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-2">
              Verified
            </div>
            <div className="text-2xl md:text-3xl font-semibold bg-gradient-to-b from-sky-700 to-sky-500 bg-clip-text text-transparent">
              {drivers.filter((d) => d.isVerified).length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Checked</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-sm p-4 md:p-5 border border-slate-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, email, phone, or license..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-full bg-[#f8f8f8] text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filterStatus === "all"
                    ? "bg-slate-900 text-white shadow-md"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus("active")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filterStatus === "active"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterStatus("inactive")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filterStatus === "inactive"
                    ? "bg-red-600 text-white shadow-md"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                Inactive
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
            <p className="font-medium">Error loading drivers</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Driver List */}
        {filteredDrivers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 border border-slate-200 text-center">
            <p className="text-slate-500 text-sm">
              {searchTerm || filterStatus !== "all"
                ? "No drivers found matching your filters"
                : "No drivers in your fleet yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDrivers.map((driver) => (
              <div
                key={driver._id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all"
              >
                <div className="p-6">
                  {/* Driver Header */}
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-slate-900">
                          {driver.name}
                        </h3>
                        <div className="flex gap-2">
                          {driver.isActive ? (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                              Inactive
                            </span>
                          )}
                          {driver.isVerified && (
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              Verified
                            </span>
                          )}
                          {driver.canReceivePayments && (
                            <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                              Can Receive Payments
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-slate-600">
                        Member since {formatDate(driver.createdAt)}
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4 mt-4 md:mt-0">
                      <div className="text-center">
                        <div className="text-xs text-slate-600 mb-1">
                          Completed Trips
                        </div>
                        <div className="text-lg font-bold text-slate-900">
                          {driver.stats?.completedTrips || 0}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-slate-600 mb-1">
                          Unpaid rides
                        </div>
                        <div className="text-lg font-bold text-amber-600">
                          {driverPayouts[driver._id]?.loading
                            ? "…"
                            : driverPayouts[driver._id]?.unpaidBookingsCount ||
                              0}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Driver Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                    {/* Contact Information */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-slate-900 mb-2">
                        Contact Information
                      </h4>
                      <div className="text-sm">
                        <span className="text-slate-600">Email:</span>
                        <div className="font-medium text-slate-900">
                          {driver.email}
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-600">Phone:</span>
                        <div className="font-medium text-slate-900">
                          {driver.phone}
                        </div>
                      </div>
                      {driver.address &&
                        (driver.address.street || driver.address.city) && (
                          <div className="text-sm">
                            <span className="text-slate-600">Address:</span>
                            <div className="font-medium text-slate-900">
                              {[
                                driver.address.street,
                                driver.address.city,
                                driver.address.state,
                                driver.address.zip,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* License Information */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-slate-900 mb-2">
                        License Information
                      </h4>
                      <div className="text-sm">
                        <span className="text-slate-600">License Number:</span>
                        <div className="font-medium text-slate-900 font-mono">
                          {driver.licenseNumber}
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Details */}
                    {driver.vehicleDetails && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-slate-900 mb-2">
                          Vehicle Details
                        </h4>
                        {driver.vehicleDetails.make && (
                          <div className="text-sm">
                            <span className="text-slate-600">Vehicle:</span>
                            <div className="font-medium text-slate-900">
                              {driver.vehicleDetails.year}{" "}
                              {driver.vehicleDetails.make}{" "}
                              {driver.vehicleDetails.model}
                            </div>
                          </div>
                        )}
                        {driver.vehicleDetails.licensePlate && (
                          <div className="text-sm">
                            <span className="text-slate-600">
                              License Plate:
                            </span>
                            <div className="font-medium text-slate-900 font-mono">
                              {driver.vehicleDetails.licensePlate}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Payment Information */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-slate-900 mb-2">
                        Payment Information
                      </h4>
                      {driverPayouts[driver._id]?.loading ? (
                        <div className="text-sm text-slate-500">
                          Calculating payout...
                        </div>
                      ) : driverPayouts[driver._id]?.error ? (
                        <div className="text-sm text-red-600">
                          {driverPayouts[driver._id].error}
                        </div>
                      ) : (
                        <>
                          <div className="text-sm bg-green-50 p-3 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-slate-600">
                                Amount Due:
                              </span>
                              <span className="text-lg font-bold text-green-700">
                                {formatCurrency(
                                  driverPayouts[driver._id]?.totalDue || 0
                                )}
                              </span>
                            </div>
                            {driverPayouts[driver._id]?.unpaidBookingsCount >
                              0 && (
                              <p className="text-xs text-green-700">
                                {driverPayouts[driver._id].unpaidBookingsCount}{" "}
                                unpaid booking
                                {driverPayouts[driver._id]
                                  .unpaidBookingsCount !== 1
                                  ? "s"
                                  : ""}
                              </p>
                            )}
                          </div>
                          {driverPayouts[driver._id]?.totalDue > 0 && (
                            <button
                              onClick={() =>
                                handlePayDriver(
                                  driver._id,
                                  driverPayouts[driver._id].totalDue
                                )
                              }
                              disabled={
                                payingDriver === driver._id ||
                                !driverPayouts[driver._id]?.hasBankDetails
                              }
                              className={`w-full mt-2 px-4 py-2.5 rounded-full font-semibold text-sm transition-colors ${
                                driverPayouts[driver._id]?.hasBankDetails
                                  ? "bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300"
                                  : "bg-slate-200 text-slate-500 cursor-not-allowed"
                              }`}
                            >
                              {payingDriver === driver._id
                                ? "Processing..."
                                : !driverPayouts[driver._id]?.hasBankDetails
                                ? "Bank Details Required"
                                : `Pay ${formatCurrency(
                                    driverPayouts[driver._id].totalDue
                                  )}`}
                            </button>
                          )}
                          {!driverPayouts[driver._id]?.hasBankDetails &&
                            driverPayouts[driver._id]?.totalDue > 0 && (
                              <p className="text-xs text-amber-600 mt-1">
                                Driver needs to add bank details to receive
                                payments
                              </p>
                            )}
                        </>
                      )}
                    </div>

                    {/* Bank Details */}
                    {driver.bankDetails && driver.bankDetails.accountName && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-slate-900 mb-2">
                          Bank Details
                        </h4>
                        <div className="text-sm">
                          <span className="text-slate-600">Account Name:</span>
                          <div className="font-medium text-slate-900">
                            {driver.bankDetails.accountName}
                          </div>
                        </div>
                        {driver.bankDetails.bankName && (
                          <div className="text-sm">
                            <span className="text-slate-600">Bank:</span>
                            <div className="font-medium text-slate-900">
                              {driver.bankDetails.bankName}
                            </div>
                          </div>
                        )}
                        {driver.bankDetails.accountNumber && (
                          <div className="text-sm">
                            <span className="text-slate-600">Account:</span>
                            <div className="font-medium text-slate-900 font-mono">
                              ****{driver.bankDetails.accountNumber.slice(-4)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Stripe Information */}
                    {driver.stripeAccountID && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-slate-900 mb-2">
                          Stripe Information
                        </h4>
                        <div className="text-sm">
                          <span className="text-slate-600">Account ID:</span>
                          <div className="font-medium text-slate-900 font-mono text-xs">
                            {driver.stripeAccountID}
                          </div>
                        </div>
                        <div className="text-sm">
                          <span className="text-slate-600">Verified:</span>
                          <div className="font-medium text-slate-900">
                            {driver.stripeAccountVerified ? (
                              <span className="text-green-600">✓ Yes</span>
                            ) : (
                              <span className="text-red-600">✗ No</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
