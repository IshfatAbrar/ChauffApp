"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { TimeContext } from "../../context/TimeContext";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MIN_LEAD_MS = 6 * 60 * 60 * 1000;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function sameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function combineDateAndTime(day, hours, minutes) {
  const next = new Date(day);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

function getMinPickup() {
  return new Date(Date.now() + MIN_LEAD_MS);
}

function roundUpToSlot(date, slotMinutes = 30) {
  const d = new Date(date);
  const mins = d.getMinutes();
  const rem = mins % slotMinutes;
  if (rem !== 0 || d.getSeconds() > 0 || d.getMilliseconds() > 0) {
    d.setMinutes(mins + (slotMinutes - rem));
  }
  d.setSeconds(0, 0);
  return d;
}

function buildTimeSlots(day) {
  const minPickup = getMinPickup();
  const slots = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const slot = combineDateAndTime(day, h, m);
      if (slot.getTime() >= minPickup.getTime()) {
        slots.push(slot);
      }
    }
  }
  return slots;
}

function formatDisplay(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatTimeLabel(date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function DateSelecter() {
  const { time, setTime } = useContext(TimeContext);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => startOfDay(new Date()));
  const [draftDay, setDraftDay] = useState(null);
  const [draftTime, setDraftTime] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const minPickup = useMemo(() => getMinPickup(), [open]);
  const minDay = useMemo(() => startOfDay(minPickup), [minPickup]);

  const openPicker = () => {
    const base = time && time.getTime() >= getMinPickup().getTime()
      ? new Date(time)
      : roundUpToSlot(getMinPickup());

    setViewMonth(startOfDay(new Date(base.getFullYear(), base.getMonth(), 1)));
    setDraftDay(startOfDay(base));
    setDraftTime(base);
    setOpen(true);
  };

  const closePicker = () => setOpen(false);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") closePicker();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const first = new Date(year, month, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < startPad; i++) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(new Date(year, month, day));
    }
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    return cells;
  }, [viewMonth]);

  const timeSlots = useMemo(() => {
    if (!draftDay) return [];
    return buildTimeSlots(draftDay);
  }, [draftDay, open]);

  const selectDay = (day) => {
    if (!day || startOfDay(day) < minDay) return;
    setDraftDay(startOfDay(day));

    const slots = buildTimeSlots(day);
    if (slots.length === 0) {
      setDraftTime(null);
      return;
    }

    if (
      draftTime &&
      sameDay(draftTime, day) &&
      draftTime.getTime() >= getMinPickup().getTime()
    ) {
      return;
    }

    // Keep similar clock time when possible, else first available slot
    if (draftTime) {
      const preferred = combineDateAndTime(
        day,
        draftTime.getHours(),
        draftTime.getMinutes()
      );
      const match = slots.find((s) => s.getTime() === preferred.getTime());
      setDraftTime(match || slots[0]);
    } else {
      setDraftTime(slots[0]);
    }
  };

  const canConfirm =
    draftTime && draftTime.getTime() >= getMinPickup().getTime();

  const confirm = () => {
    if (!canConfirm) return;
    setTime(new Date(draftTime));
    setOpen(false);
  };

  const shiftMonth = (delta) => {
    setViewMonth((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
      const minMonth = new Date(minDay.getFullYear(), minDay.getMonth(), 1);
      if (next < minMonth) return prev;
      return next;
    });
  };

  const canGoPrevMonth = useMemo(() => {
    const prev = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
    const minMonth = new Date(minDay.getFullYear(), minDay.getMonth(), 1);
    return prev >= minMonth;
  }, [viewMonth, minDay]);

  const sheet =
    mounted && open
      ? createPortal(
          <div
            className="fixed inset-0 z-[100000] flex items-end justify-center sm:items-center sm:p-4"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <button
              type="button"
              aria-label="Close pickup time picker"
              className="absolute inset-0 bg-black/70"
              onClick={closePicker}
            />

            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="pickup-time-title"
              className="relative z-10 flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-obsidian shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:rounded-2xl"
            >
              <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-white/20 sm:hidden" />

              <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
                    Pickup
                  </p>
                  <h2
                    id="pickup-time-title"
                    className="mt-1 font-instrument text-[28px] leading-[1.1] tracking-[-0.02em] text-paper"
                  >
                    Choose time
                  </h2>
                  <p className="mt-1 font-body text-[13px] text-ash">
                    Bookings must be at least 6 hours ahead.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closePicker}
                  className="mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-frost transition-colors hover:border-white/35 hover:text-paper"
                  aria-label="Close"
                >
                  <i className="fa-solid fa-xmark text-sm" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3">
                <div className="mb-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => shiftMonth(-1)}
                    disabled={!canGoPrevMonth}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-frost disabled:opacity-30"
                    aria-label="Previous month"
                  >
                    <i className="fa-solid fa-chevron-left text-xs" />
                  </button>
                  <p className="font-body text-[15px] font-medium text-paper">
                    {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                  </p>
                  <button
                    type="button"
                    onClick={() => shiftMonth(1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-frost"
                    aria-label="Next month"
                  >
                    <i className="fa-solid fa-chevron-right text-xs" />
                  </button>
                </div>

                <div className="mb-2 grid grid-cols-7 gap-1">
                  {WEEKDAYS.map((d) => (
                    <div
                      key={d}
                      className="py-1 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-ash"
                    >
                      {d}
                    </div>
                  ))}
                  {calendarDays.map((day, idx) => {
                    if (!day) {
                      return <div key={`empty-${idx}`} className="h-10" />;
                    }
                    const disabled = startOfDay(day) < minDay;
                    const selected = sameDay(day, draftDay);
                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        disabled={disabled}
                        onClick={() => selectDay(day)}
                        className={`h-10 rounded-xl font-body text-[14px] transition-colors ${
                          selected
                            ? "bg-paper text-void"
                            : disabled
                              ? "cursor-not-allowed text-ash/35"
                              : "text-paper hover:bg-white/10"
                        }`}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
                    Time
                  </p>
                  {timeSlots.length === 0 ? (
                    <p className="rounded-xl border border-white/10 bg-graphite px-3 py-4 font-body text-[13px] text-ash">
                      No times left today. Pick another day.
                    </p>
                  ) : (
                    <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
                      {timeSlots.map((slot) => {
                        const selected =
                          draftTime && slot.getTime() === draftTime.getTime();
                        return (
                          <button
                            key={slot.toISOString()}
                            type="button"
                            onClick={() => setDraftTime(slot)}
                            className={`rounded-xl px-2 py-2.5 font-body text-[13px] transition-colors ${
                              selected
                                ? "bg-paper text-void"
                                : "border border-white/10 bg-graphite text-frost hover:border-white/25 hover:text-paper"
                            }`}
                          >
                            {formatTimeLabel(slot)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="shrink-0 border-t border-white/10 bg-obsidian px-5 py-4">
                <p className="mb-3 text-center font-body text-[13px] text-frost">
                  {canConfirm
                    ? formatDisplay(draftTime)
                    : "Select a date and time"}
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closePicker}
                    className="flex-1 rounded-full border border-white/20 py-3.5 font-body text-[15px] text-paper transition-colors hover:border-white/40"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirm}
                    disabled={!canConfirm}
                    className="flex-1 rounded-full bg-paper py-3.5 font-body text-[15px] font-medium text-void transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Okay
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
          Pickup Time
        </label>
        <div title="You can only book six hours ahead">
          <i className="fa-solid fa-circle-info text-[10px] text-ash" />
        </div>
      </div>

      <button
        type="button"
        onClick={openPicker}
        className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-graphite px-3.5 py-3 text-left transition-colors hover:border-white/25"
      >
        <i className="fa-regular fa-calendar text-ash" aria-hidden="true" />
        <span
          className={`flex-1 font-body text-[14px] ${
            time ? "text-paper" : "text-ash"
          }`}
        >
          {time ? formatDisplay(time) : "Select pickup date & time"}
        </span>
        {time ? (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear pickup time"
            className="px-1 text-ash hover:text-paper"
            onClick={(e) => {
              e.stopPropagation();
              setTime(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                setTime(null);
              }
            }}
          >
            <i className="fa-solid fa-xmark" />
          </span>
        ) : null}
      </button>

      {sheet}
    </div>
  );
}

export default DateSelecter;
