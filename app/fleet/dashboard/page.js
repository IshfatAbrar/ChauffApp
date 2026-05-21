import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../../lib/auth";
import Link from "next/link";
import DeleteStripeButton from "../../../components/Fleet/DeleteStripeButton";
import FleetSubpageHero from "../../../components/Fleet/FleetSubpageHero";
import { headers } from "next/headers";
import { detectCountryFromRequest } from "../../../lib/utils/geolocation";
import { getFleetDashboardSnapshot } from "../../../lib/data/fleet-dashboard";
import { formatCurrency } from "../../../lib/utils/currency";

function statusBadgeClass(status) {
  const map = {
    requested: "bg-amber-50 text-amber-800 border-amber-200",
    accepted: "bg-sky-50 text-sky-800 border-sky-200",
    in_progress: "bg-emerald-50 text-emerald-800 border-emerald-200",
    completed: "bg-slate-100 text-slate-700 border-slate-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    payment_failed: "bg-red-50 text-red-800 border-red-200",
  };
  return map[status] || "bg-slate-50 text-slate-600 border-slate-200";
}

function formatShortDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function paymentModelLabel(settings) {
  if (!settings?.paymentType) return "Percentage per ride (default)";
  const p = settings.paymentType;
  if (p === "fixed_monthly")
    return `Fixed monthly${settings.fixedMonthlyAmount != null ? ` · ${formatCurrency(settings.fixedMonthlyAmount, settings.currency || "USD")}/mo` : ""}`;
  if (p === "fixed_per_ride")
    return `Fixed per ride${settings.fixedPerRideAmount != null ? ` · ${formatCurrency(settings.fixedPerRideAmount, settings.currency || "USD")}` : ""}`;
  return `Percentage per ride${settings.percentagePerRide != null ? ` · ${settings.percentagePerRide}% to drivers` : ""}`;
}

export default async function FleetDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "fleet") {
    redirect("/signin?callbackUrl=/fleet/dashboard");
  }

  const fleetId = session.user?.fleetId || session.user?.id;
  const businessName = session.user?.name || "Your fleet";

  const snapshot = await getFleetDashboardSnapshot(fleetId);
  const { countryName, countryCode } = await detectCountryFromRequest({
    headers: headers(),
  });

  if (!snapshot) {
    return (
      <main className="min-h-screen bg-[#f8f8f8] text-slate-900 pt-36 px-4">
        <p className="text-center text-slate-500">Could not load fleet data.</p>
      </main>
    );
  }

  const { fleet, drivers, trips, revenue } = snapshot;
  const currency = fleet.currency || "USD";
  const region = fleet.region || "US";

  const stripeOk = !!fleet.stripeAccountVerified;
  const stripeStarted = !!fleet.stripeAccountID;

  const pendingTrips =
    (trips.byStatus.requested || 0) +
    (trips.byStatus.accepted || 0) +
    (trips.byStatus.in_progress || 0);

  return (
    <main className="min-h-screen bg-[#f8f8f8] text-slate-900 pt-36 lg:pt-40 pb-16 md:pb-24">
      <FleetSubpageHero
        eyebrow={
          <>
            Operations
            <span className="text-slate-300">—</span>
            live overview
          </>
        }
        title={`${businessName}`}
        description="Drivers, trips, revenue, and payouts at a glance. Use the shortcuts to drill into each area."
      />

      <div className="border-t border-slate-200" />

      <div className="max-w-7xl mx-auto px-4 pt-8 space-y-6">
        {/* Context chips */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-500 shadow-sm">
            Region <span className="font-medium text-slate-700">{region}</span>
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-500 shadow-sm">
            {countryName} ({countryCode})
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-500 shadow-sm">
            Currency{" "}
            <span className="font-medium text-slate-700">{currency}</span>
          </span>
        </div>

        {/* KPI strip */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-2">
              Drivers
            </p>
            <p className="text-2xl font-semibold bg-gradient-to-b from-slate-900 to-slate-500 bg-clip-text text-transparent">
              {drivers.active}
              <span className="text-slate-400 font-normal text-lg">
                {" "}
                / {drivers.total}
              </span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">active · total</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-2">
              Trip pipeline
            </p>
            <p className="text-2xl font-semibold bg-gradient-to-b from-sky-800 to-sky-500 bg-clip-text text-transparent">
              {pendingTrips}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              requested / active / in progress
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-2">
              Revenue (month)
            </p>
            <p className="text-xl md:text-2xl font-semibold bg-gradient-to-b from-emerald-800 to-emerald-500 bg-clip-text text-transparent tabular-nums">
              {formatCurrency(revenue.thisMonth, currency)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              completed trips · calendar month
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-2">
              Stripe
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {stripeOk
                ? "Verified"
                : stripeStarted
                  ? "Needs attention"
                  : "Not connected"}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {stripeOk
                ? "Ready for payouts"
                : "Complete onboarding in Payments"}
            </p>
          </div>
        </section>

        {/* Secondary stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2.5">
            <p className="text-lg font-semibold text-slate-900">
              {trips.byStatus.completed || 0}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              Completed
            </p>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2.5">
            <p className="text-lg font-semibold text-slate-900">
              {trips.byStatus.cancelled || 0}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              Cancelled
            </p>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2.5">
            <p className="text-lg font-semibold text-slate-900">
              {drivers.verified}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              Verified drivers
            </p>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2.5">
            <p className="text-lg font-semibold text-slate-900">
              {formatCurrency(revenue.allTime, currency)}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              All-time trip total
            </p>
          </div>
        </section>

        {/* Payments row */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-1">
                  Payments &amp; Stripe
                </p>
                <h2 className="text-base font-semibold text-slate-900">
                  Payout readiness
                </h2>
              </div>
              <Link
                href="/fleet/payments"
                className="text-xs font-semibold text-slate-700 rounded-full border border-slate-200 px-4 py-2 hover:bg-slate-50 transition"
              >
                Open payments →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-xs text-slate-500 mb-1">Stripe Connect</p>
                <p className="text-sm font-medium text-slate-900">
                  {stripeOk
                    ? "Account verified"
                    : stripeStarted
                      ? "Onboarding in progress"
                      : "Not linked yet"}
                </p>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  {stripeOk
                    ? "Customer charges can settle to your connected account."
                    : "Connect Stripe to receive ride revenue and pay drivers."}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-xs text-slate-500 mb-1">Driver pay model</p>
                <p className="text-sm font-medium text-slate-900 leading-snug">
                  {paymentModelLabel({
                    ...fleet.driverPaymentSettings,
                    currency,
                  })}
                </p>
                <p className="text-[11px] text-slate-500 mt-2">
                  {drivers.payoutReady} driver
                  {drivers.payoutReady !== 1 ? "s" : ""} marked payout-ready
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 shadow-sm flex flex-col">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-2">
              Quick actions
            </p>
            <ul className="space-y-2 flex-1">
              <li>
                <Link
                  href="/fleet/drivers"
                  className="block text-sm font-medium text-slate-800 hover:text-slate-950 py-1.5"
                >
                  Review drivers →
                </Link>
              </li>
              <li>
                <Link
                  href="/fleet/bookings"
                  className="block text-sm font-medium text-slate-800 hover:text-slate-950 py-1.5"
                >
                  Trips &amp; activity →
                </Link>
              </li>
              <li>
                <Link
                  href="/fleet/payments"
                  className="block text-sm font-medium text-slate-800 hover:text-slate-950 py-1.5"
                >
                  Stripe &amp; bank →
                </Link>
              </li>
              <li>
                <Link
                  href="/fleet"
                  className="block text-sm font-medium text-slate-500 hover:text-slate-800 py-1.5"
                >
                  Fleet marketing page
                </Link>
              </li>
            </ul>
          </div>
        </section>

        {/* Drivers + Trips tables */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  Team
                </p>
                <h3 className="text-sm font-semibold text-slate-900">
                  Recent drivers
                </h3>
              </div>
              <Link
                href="/fleet/drivers"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                View all
              </Link>
            </div>
            <div className="overflow-x-auto">
              {drivers.recent.length === 0 ? (
                <p className="text-sm text-slate-500 px-4 py-8 text-center">
                  No drivers yet. Add drivers from the drivers area once
                  onboarding is ready.
                </p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      <th className="px-4 py-2 font-medium">Name</th>
                      <th className="px-4 py-2 font-medium hidden sm:table-cell">
                        Email
                      </th>
                      <th className="px-4 py-2 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.recent.map((d) => (
                      <tr
                        key={d._id.toString()}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                      >
                        <td className="px-4 py-2.5 font-medium text-slate-900">
                          {d.name}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 text-xs hidden sm:table-cell truncate max-w-[180px]">
                          {d.email}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span
                            className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              d.isActive
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {d.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  Trips
                </p>
                <h3 className="text-sm font-semibold text-slate-900">
                  Recent activity
                </h3>
              </div>
              <Link
                href="/fleet/bookings"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                View all
              </Link>
            </div>
            <div className="overflow-x-auto">
              {trips.recent.length === 0 ? (
                <p className="text-sm text-slate-500 px-4 py-8 text-center">
                  No bookings assigned to your drivers yet.
                </p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      <th className="px-4 py-2 font-medium">Route / driver</th>
                      <th className="px-4 py-2 font-medium hidden md:table-cell">
                        When
                      </th>
                      <th className="px-4 py-2 font-medium text-right">Amt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.recent.map((b) => {
                      const pickup =
                        b.pickupLocation?.label ||
                        b.pickupLocation?.name ||
                        "Pickup";
                      const drop =
                        b.dropoffLocation?.label ||
                        b.dropoffLocation?.name ||
                        "Dropoff";
                      const driverName =
                        b.chauffeur?.name || "Unassigned";
                      return (
                        <tr
                          key={b._id.toString()}
                          className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                        >
                          <td className="px-4 py-2.5">
                            <p className="text-xs text-slate-900 line-clamp-1">
                              {pickup} → {drop}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {driverName}
                              <span
                                className={`ml-2 inline-block px-1.5 py-px rounded border text-[9px] font-semibold ${statusBadgeClass(b.status)}`}
                              >
                                {b.status?.replace(/_/g, " ")}
                              </span>
                            </p>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-500 hidden md:table-cell whitespace-nowrap">
                            {formatShortDate(b.createdAt)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-xs font-medium text-slate-900 tabular-nums">
                            {formatCurrency(b.price, b.currency || currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>

        {/* Health checklist */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-2">
              Business health
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex gap-2">
                <span className={stripeOk ? "text-emerald-600" : "text-amber-500"}>
                  {stripeOk ? "✓" : "○"}
                </span>
                Stripe connected and verified for payouts
              </li>
              <li className="flex gap-2">
                <span
                  className={
                    drivers.total > 0 ? "text-emerald-600" : "text-amber-500"
                  }
                >
                  {drivers.total > 0 ? "✓" : "○"}
                </span>
                At least one driver on the fleet
              </li>
              <li className="flex gap-2">
                <span
                  className={
                    (trips.byStatus.completed || 0) > 0
                      ? "text-emerald-600"
                      : "text-slate-400"
                  }
                >
                  {(trips.byStatus.completed || 0) > 0 ? "✓" : "○"}
                </span>
                Completed trips recorded (revenue baseline)
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-2">
              Fleet account
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Account status:{" "}
              <span className="font-medium text-slate-700">
                {fleet.status || "—"}
              </span>
              {fleet.isActive === false && (
                <span className="block mt-2 text-amber-700">
                  This fleet record is marked inactive — contact support if
                  unexpected.
                </span>
              )}
            </p>
          </div>
        </section>

        <section className="pt-2">
          <DeleteStripeButton />
        </section>
      </div>
    </main>
  );
}
