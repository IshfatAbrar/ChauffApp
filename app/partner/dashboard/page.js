import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../../lib/auth";
import Link from "next/link";
import {
  Wallet,
  Route,
  Users,
  Check,
  MapPinned,
  CreditCard,
  Car,
} from "lucide-react";
import { getFleetDashboardSnapshot } from "../../../lib/data/fleet-dashboard";
import { formatCurrency } from "../../../lib/utils/currency";

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

function statusLabel(status) {
  if (!status) return "—";
  return status.replace(/_/g, " ");
}

function firstName(name) {
  if (!name) return "there";
  return name.trim().split(/\s+/)[0];
}

export default async function FleetDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "fleet") {
    redirect("/signin?callbackUrl=/partner/dashboard");
  }

  const fleetId = session.user?.fleetId || session.user?.id;
  const businessName = session.user?.name || "Your partnership";

  const snapshot = await getFleetDashboardSnapshot(fleetId);

  if (!snapshot) {
    return (
      <main className="min-h-screen bg-void px-6 pt-10 text-ash md:px-8">
        Could not load partner data.
      </main>
    );
  }

  const { fleet, drivers, trips, revenue } = snapshot;
  const currency = fleet.currency || "USD";
  const stripeOk = !!fleet.stripeAccountVerified;
  const stripeStarted = !!fleet.stripeAccountID;

  const activeTrips =
    (trips.byStatus.requested || 0) +
    (trips.byStatus.accepted || 0) +
    (trips.byStatus.in_progress || 0);

  const completedTrips = trips.byStatus.completed || 0;
  const greetName = firstName(businessName);

  const kpis = [
    {
      label: "Revenue",
      value: formatCurrency(revenue.thisMonth, currency),
      hint: "This month",
      icon: Wallet,
    },
    {
      label: "Active trips",
      value: String(activeTrips),
      hint: "In pipeline",
      icon: Route,
    },
    {
      label: "Drivers",
      value: `${drivers.active}`,
      hint: `${drivers.total} total`,
      icon: Users,
    },
    {
      label: "Completed",
      value: String(completedTrips),
      hint: "All time",
      icon: Check,
    },
  ];

  return (
    <main className="min-h-screen bg-void pb-16 font-body text-paper md:pb-20">
      <div className="mx-auto max-w-6xl px-6 pt-8 md:px-8 md:pt-10">
        {/* Greeting */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-body text-[32px] font-medium leading-[1.15] tracking-[-0.02em] text-paper md:text-[36px]">
              Hello {greetName}, here&apos;s your overview
            </h1>
            <p className="mt-2 font-body text-[15px] text-ash">
              {businessName}
              {fleet.region ? ` · ${fleet.region}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/partner/assign"
              className="inline-flex items-center gap-2 rounded-full border border-fleet-border-strong px-4 py-2.5 font-body text-[13px] text-frost transition-colors hover:border-fleet-border-strong hover:text-paper"
            >
              <MapPinned size={15} strokeWidth={1.75} aria-hidden="true" />
              Assign rides
            </Link>
            <Link
              href="/partner/payments"
              className="inline-flex items-center gap-2 rounded-full bg-paper px-4 py-2.5 font-body text-[13px] text-fleet-on-paper transition-opacity hover:opacity-90"
            >
              <CreditCard size={15} strokeWidth={1.75} aria-hidden="true" />
              Payments
            </Link>
          </div>
        </div>

        {/* KPI cards */}
        <section className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
            <div
              key={kpi.label}
              className="rounded-2xl border border-fleet-border bg-obsidian p-5"
            >
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-graphite text-frost">
                <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
              </div>
              <p className="font-body text-[13px] text-ash">{kpi.label}</p>
              <p className="mt-1 font-body text-[26px] font-medium tracking-[-0.02em] text-paper tabular-nums md:text-[28px]">
                {kpi.value}
              </p>
              <p className="mt-1 font-mono text-[11px] text-ash">{kpi.hint}</p>
            </div>
            );
          })}
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent trips */}
          <section className="rounded-2xl border border-fleet-border bg-obsidian lg:col-span-2">
            <div className="flex items-center justify-between px-5 py-4 md:px-6">
              <h2 className="font-body text-[17px] font-medium text-paper">
                Latest trips
              </h2>
              <Link
                href="/partner/bookings"
                className="font-body text-[13px] text-ash transition-colors hover:text-paper"
              >
                See all
              </Link>
            </div>

            {trips.recent.length === 0 ? (
              <p className="px-5 pb-6 font-body text-[14px] text-ash md:px-6">
                No trips yet. New bookings will show up here.
              </p>
            ) : (
              <ul className="divide-y divide-fleet-border border-t border-fleet-border">
                {trips.recent.slice(0, 5).map((b) => {
                  const pickup =
                    b.pickupLocation?.label ||
                    b.pickupLocation?.name ||
                    "Pickup";
                  const drop =
                    b.dropoffLocation?.label ||
                    b.dropoffLocation?.name ||
                    "Dropoff";
                  const driverName = b.chauffeur?.name || "Unassigned";

                  return (
                    <li
                      key={b._id.toString()}
                      className="flex items-center gap-4 px-5 py-4 md:px-6"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-graphite text-frost">
                        <Car size={15} strokeWidth={1.75} aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-body text-[14px] text-paper">
                          {pickup} → {drop}
                        </p>
                        <p className="mt-0.5 font-body text-[12px] text-ash">
                          {driverName}
                          <span className="mx-1.5 text-white/20">·</span>
                          {statusLabel(b.status)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-body text-[14px] text-paper tabular-nums">
                          {formatCurrency(b.price, b.currency || currency)}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-ash">
                          {formatShortDate(b.createdAt)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Side panel */}
          <aside className="flex flex-col gap-4">
            <div className="rounded-2xl border border-fleet-border bg-obsidian p-5 md:p-6">
              <h2 className="font-body text-[17px] font-medium text-paper">
                Payments
              </h2>
              <p className="mt-2 font-body text-[14px] leading-relaxed text-ash">
                {stripeOk
                  ? "Stripe is verified and ready for payouts."
                  : stripeStarted
                    ? "Finish Stripe onboarding to receive payouts."
                    : "Connect Stripe to collect and pay out trip revenue."}
              </p>
              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between font-body text-[12px] text-ash">
                  <span>Stripe setup</span>
                  <span>
                    {stripeOk ? "Complete" : stripeStarted ? "In progress" : "Not started"}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-graphite">
                  <div
                    className="h-full rounded-full bg-paper transition-all"
                    style={{
                      width: stripeOk ? "100%" : stripeStarted ? "55%" : "15%",
                    }}
                  />
                </div>
              </div>
              <Link
                href="/partner/payments"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-paper px-4 py-2.5 font-body text-[13px] text-fleet-on-paper transition-opacity hover:opacity-90"
              >
                {stripeOk ? "Manage payments" : "Set up payments"}
              </Link>
            </div>

            <div className="rounded-2xl border border-fleet-border bg-obsidian p-5 md:p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-body text-[17px] font-medium text-paper">
                  Settings
                </h2>
                <Link
                  href="/partner/settings"
                  className="font-body text-[13px] text-ash transition-colors hover:text-paper"
                >
                  Open
                </Link>
              </div>
              <p className="mt-3 font-body text-[14px] leading-relaxed text-ash">
                Manage driver permissions and pay models.
              </p>
              <Link
                href="/partner/settings"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-fleet-border-strong px-4 py-2.5 font-body text-[13px] text-frost transition-colors hover:border-fleet-border-strong hover:text-paper"
              >
                Go to settings
              </Link>
            </div>

            <div className="rounded-2xl border border-fleet-border bg-obsidian p-5 md:p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-body text-[17px] font-medium text-paper">
                  Drivers
                </h2>
                <Link
                  href="/partner/drivers"
                  className="font-body text-[13px] text-ash transition-colors hover:text-paper"
                >
                  See all
                </Link>
              </div>
              {drivers.recent.length === 0 ? (
                <p className="mt-3 font-body text-[14px] text-ash">
                  No chauffeurs linked yet. Solo partners: add yourself as a
                  driver to take rides.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {drivers.recent.slice(0, 4).map((d) => (
                    <li key={d._id.toString()} className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-graphite font-body text-[12px] text-frost">
                        {(d.name || "?").charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-body text-[14px] text-paper">
                          {d.name}
                        </p>
                        <p className="font-body text-[12px] text-ash">
                          {d.isActive ? "Active" : "Inactive"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
