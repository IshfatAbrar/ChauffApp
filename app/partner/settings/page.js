"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import FleetPageHeader from "../../../components/Fleet/FleetPageHeader";

const PERMISSION_META = [
  {
    key: "driversCanAccept",
    label: "Drivers can accept bookings",
    desc: "Allow drivers to self-assign rides via the mobile app. Disable to make all assignments partner-managed only.",
    offWarning: "Partner assigns all bookings",
  },
  {
    key: "driversCanCancel",
    label: "Drivers can release bookings",
    desc: "Allow drivers to cancel / release an accepted booking from the app.",
    offWarning: "Only partner can release bookings",
  },
];

function Toggle({ enabled, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
        enabled ? "bg-paper" : "bg-fleet-muted"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full shadow transition duration-200 ${
          enabled
            ? "translate-x-5 bg-fleet-on-paper"
            : "translate-x-0 bg-obsidian"
        }`}
      />
    </button>
  );
}

export default function FleetSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [permissions, setPermissions] = useState({
    driversCanAccept: true,
    driversCanCancel: true,
  });
  const [savedPermissions, setSavedPermissions] = useState({
    driversCanAccept: true,
    driversCanCancel: true,
  });
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [permissionsSaving, setPermissionsSaving] = useState(false);

  const [paySettings, setPaySettings] = useState({
    paymentType: "percentage_per_ride",
    fixedMonthlyAmount: 0,
    fixedPerRideAmount: 0,
    percentagePerRide: 90,
  });
  const [payLoading, setPayLoading] = useState(true);
  const [paySaving, setPaySaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin?callbackUrl=/partner/settings");
    } else if (status === "authenticated" && session?.user?.role !== "fleet") {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "fleet") {
      loadPermissions();
      loadPaySettings();
    }
  }, [status, session]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadPermissions = async () => {
    setPermissionsLoading(true);
    try {
      const res = await fetch("/api/fleet/bookings/settings");
      const data = await res.json();
      if (data.success && data.settings) {
        setPermissions(data.settings);
        setSavedPermissions(data.settings);
      }
    } catch {
      // keep defaults
    } finally {
      setPermissionsLoading(false);
    }
  };

  const savePermissions = async () => {
    setPermissionsSaving(true);
    try {
      const res = await fetch("/api/fleet/bookings/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(permissions),
      });
      const data = await res.json();
      if (data.success) {
        setPermissions(data.settings);
        setSavedPermissions(data.settings);
        showToast("success", "Driver permissions saved.");
      } else {
        showToast("error", data.message || "Failed to save permissions.");
      }
    } catch {
      showToast("error", "Failed to save permissions.");
    } finally {
      setPermissionsSaving(false);
    }
  };

  const loadPaySettings = async () => {
    setPayLoading(true);
    try {
      const res = await fetch("/api/fleet/driver-payment-settings");
      const data = await res.json();
      if (res.ok && data.success) {
        setPaySettings({
          paymentType: data.settings.paymentType || "percentage_per_ride",
          fixedMonthlyAmount: data.settings.fixedMonthlyAmount || 0,
          fixedPerRideAmount: data.settings.fixedPerRideAmount || 0,
          percentagePerRide: data.settings.percentagePerRide || 90,
        });
      }
    } catch (error) {
      console.error("Error fetching driver payment settings", error);
    } finally {
      setPayLoading(false);
    }
  };

  const savePaySettings = async () => {
    setPaySaving(true);
    try {
      const res = await fetch("/api/fleet/driver-payment-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paySettings),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", "Driver pay settings saved.");
      } else {
        showToast("error", data.message || "Failed to save pay settings.");
      }
    } catch {
      showToast("error", "Failed to save pay settings.");
    } finally {
      setPaySaving(false);
    }
  };

  const permissionsChanged =
    permissions.driversCanAccept !== savedPermissions.driversCanAccept ||
    permissions.driversCanCancel !== savedPermissions.driversCanCancel;

  if (status === "loading" || permissionsLoading || payLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-void">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-fleet-border border-t-paper" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-void pb-16 font-body text-paper md:pb-20">
      <section className="mx-auto max-w-5xl space-y-6 px-6 pt-8 md:px-8 md:pt-10">
        <FleetPageHeader
          title="Settings"
          description="Driver permissions and how you pay chauffeurs."
        />

        {/* Driver permissions */}
        <div className="overflow-hidden rounded-2xl border border-fleet-border bg-obsidian">
          <div className="flex items-center justify-between gap-3 border-b border-fleet-border px-5 py-4 md:px-6">
            <div>
              <h2 className="font-body text-[17px] font-medium text-paper">
                Driver permissions
              </h2>
              <p className="mt-1 font-body text-[13px] text-ash">
                Control what drivers can do in the app.
              </p>
            </div>
            {permissionsChanged && (
              <button
                type="button"
                onClick={savePermissions}
                disabled={permissionsSaving}
                className="rounded-full bg-paper px-4 py-2 font-body text-[13px] text-fleet-on-paper transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {permissionsSaving ? "Saving…" : "Save"}
              </button>
            )}
          </div>

          <div className="divide-y divide-fleet-border">
            {PERMISSION_META.map(({ key, label, desc, offWarning }) => {
              const isOn = permissions[key] ?? true;
              return (
                <div
                  key={key}
                  className="flex items-start justify-between gap-4 px-5 py-4 md:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex flex-wrap items-center gap-2">
                      <p className="font-body text-[14px] font-medium text-paper">
                        {label}
                      </p>
                      {!isOn && (
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-px font-body text-[10px] font-semibold text-amber-300">
                          {offWarning}
                        </span>
                      )}
                    </div>
                    <p className="font-body text-[13px] leading-relaxed text-ash">
                      {desc}
                    </p>
                  </div>
                  <Toggle
                    enabled={isOn}
                    onChange={(val) =>
                      setPermissions((prev) => ({ ...prev, [key]: val }))
                    }
                    disabled={permissionsSaving}
                  />
                </div>
              );
            })}
          </div>

          {permissionsChanged && (
            <div className="flex items-center justify-between gap-3 border-t border-amber-500/20 bg-amber-500/10 px-5 py-3 md:px-6">
              <p className="font-body text-[12px] text-amber-300">
                You have unsaved changes.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPermissions(savedPermissions)}
                  className="rounded-full border border-amber-500/30 px-3 py-1.5 font-body text-[12px] text-amber-300 transition-colors hover:bg-amber-500/20"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={savePermissions}
                  disabled={permissionsSaving}
                  className="rounded-full bg-paper px-3 py-1.5 font-body text-[12px] font-medium text-fleet-on-paper transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {permissionsSaving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Driver pay settings */}
        <div className="rounded-2xl border border-fleet-border bg-obsidian p-5 md:p-6">
          <h2 className="font-body text-[17px] font-medium text-paper">
            Driver pay settings
          </h2>
          <p className="mt-1 font-body text-[14px] text-ash">
            How drivers are paid for completed rides.
          </p>

          <div className="mt-6 space-y-6">
            <div>
              <label className="mb-3 block font-body text-[14px] font-medium text-paper">
                Payment method
              </label>
              <div className="space-y-3">
                {[
                  {
                    value: "fixed_monthly",
                    title: "Fixed monthly payout",
                    desc: "Pay drivers a fixed amount each month regardless of rides completed.",
                  },
                  {
                    value: "fixed_per_ride",
                    title: "Fixed amount per ride",
                    desc: "Pay drivers a fixed amount for each completed ride.",
                  },
                  {
                    value: "percentage_per_ride",
                    title: "Percentage per ride",
                    desc: "Pay drivers a percentage of each ride's total price.",
                  },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-fleet-border p-4 transition-colors hover:border-fleet-border-strong hover:bg-graphite/50"
                  >
                    <input
                      type="radio"
                      name="paymentType"
                      value={opt.value}
                      checked={paySettings.paymentType === opt.value}
                      onChange={(e) =>
                        setPaySettings({
                          ...paySettings,
                          paymentType: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-body text-[14px] font-medium text-paper">
                        {opt.title}
                      </p>
                      <p className="mt-1 font-body text-[12px] text-ash">
                        {opt.desc}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {paySettings.paymentType === "fixed_monthly" && (
              <div>
                <label className="mb-2 block font-body text-[14px] font-medium text-paper">
                  Monthly amount (AUD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ash">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paySettings.fixedMonthlyAmount || ""}
                    onChange={(e) =>
                      setPaySettings({
                        ...paySettings,
                        fixedMonthlyAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl border border-fleet-border bg-graphite py-2.5 pl-8 pr-4 font-body text-paper placeholder:text-ash focus:outline-none focus:ring-1 focus:ring-fleet-border-strong"
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}

            {paySettings.paymentType === "fixed_per_ride" && (
              <div>
                <label className="mb-2 block font-body text-[14px] font-medium text-paper">
                  Amount per ride (AUD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ash">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paySettings.fixedPerRideAmount || ""}
                    onChange={(e) =>
                      setPaySettings({
                        ...paySettings,
                        fixedPerRideAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl border border-fleet-border bg-graphite py-2.5 pl-8 pr-4 font-body text-paper placeholder:text-ash focus:outline-none focus:ring-1 focus:ring-fleet-border-strong"
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}

            {paySettings.paymentType === "percentage_per_ride" && (
              <div>
                <label className="mb-2 block font-body text-[14px] font-medium text-paper">
                  Percentage per ride (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={paySettings.percentagePerRide || ""}
                    onChange={(e) =>
                      setPaySettings({
                        ...paySettings,
                        percentagePerRide: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl border border-fleet-border bg-graphite py-2.5 pl-4 pr-12 font-body text-paper placeholder:text-ash focus:outline-none focus:ring-1 focus:ring-fleet-border-strong"
                    placeholder="90"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ash">
                    %
                  </span>
                </div>
                {paySettings.percentagePerRide > 0 && (
                  <p className="mt-2 rounded-xl border border-fleet-border bg-graphite px-3 py-2 font-body text-[12px] text-ash">
                    Example: on a $100 ride, drivers receive $
                    {(
                      (paySettings.percentagePerRide / 100) *
                      100
                    ).toFixed(2)}
                    ; partner keeps $
                    {(
                      (1 - paySettings.percentagePerRide / 100) *
                      100
                    ).toFixed(2)}
                    .
                  </p>
                )}
              </div>
            )}

            <div className="border-t border-fleet-border pt-4">
              <button
                type="button"
                onClick={savePaySettings}
                disabled={paySaving}
                className="rounded-full bg-paper px-6 py-2.5 font-body text-[13px] text-fleet-on-paper transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {paySaving ? "Saving…" : "Save pay settings"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-3 font-body text-[14px] shadow-xl ${
            toast.type === "error"
              ? "bg-red-600 text-white"
              : "bg-paper text-fleet-on-paper"
          }`}
        >
          {toast.message}
        </div>
      )}
    </main>
  );
}
