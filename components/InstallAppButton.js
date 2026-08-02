"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

function getCachedPrompt() {
  if (typeof window === "undefined") return null;
  return window.__chauffDeferredPrompt || null;
}

function setCachedPrompt(event) {
  if (typeof window === "undefined") return;
  window.__chauffDeferredPrompt = event;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

/** iPhone/iPad — including iPadOS “desktop” UA. */
function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iphone|ipod|ipad/i.test(ua)) return true;
  // iPadOS 13+ can report as Macintosh
  return (
    navigator.platform === "MacIntel" &&
    typeof navigator.maxTouchPoints === "number" &&
    navigator.maxTouchPoints > 1
  );
}

function isAndroid() {
  if (typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent);
}

function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches || isIosDevice() || isAndroid();
}

/**
 * Footer CTA + install sheet. Native prompt when Chrome provides it;
 * otherwise clear mobile Add-to-Home-Screen steps (required on iOS).
 */
export default function InstallAppButton({ className = "" }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [ios, setIos] = useState(false);
  const [android, setAndroid] = useState(false);

  useEffect(() => {
    setMounted(true);
    setMobile(isMobileViewport());
    setIos(isIosDevice());
    setAndroid(isAndroid());

    if (isStandalone()) {
      setInstalled(true);
      return undefined;
    }

    try {
      if (sessionStorage.getItem("chauff-install-banner-dismissed") === "1") {
        setBannerDismissed(true);
      }
    } catch {
      /* ignore */
    }

    const syncPrompt = () => {
      const existing = getCachedPrompt();
      if (existing) setDeferredPrompt(existing);
    };

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setCachedPrompt(e);
      setDeferredPrompt(e);
    };

    const onInstalled = () => {
      setCachedPrompt(null);
      setDeferredPrompt(null);
      setInstalled(true);
      setOpen(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("chauff-beforeinstallprompt", syncPrompt);
    window.addEventListener("appinstalled", onInstalled);
    syncPrompt();

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("chauff-beforeinstallprompt", syncPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const runNativePrompt = () => {
    const promptEvent = deferredPrompt || getCachedPrompt();
    if (!promptEvent?.prompt) return false;

    setBusy(true);
    try {
      // Keep this synchronous from the click handler so Chrome accepts the gesture.
      const choice = promptEvent.prompt();
      Promise.resolve(choice)
        .then(() => promptEvent.userChoice)
        .then(({ outcome }) => {
          setCachedPrompt(null);
          setDeferredPrompt(null);
          if (outcome === "accepted") {
            setInstalled(true);
            setOpen(false);
          }
        })
        .catch((err) => {
          console.error("Install prompt failed:", err);
        })
        .finally(() => setBusy(false));
      return true;
    } catch (err) {
      console.error("Install prompt failed:", err);
      setBusy(false);
      return false;
    }
  };

  const handleGetApp = () => {
    // Always show the sheet on mobile — iOS never gets beforeinstallprompt,
    // and Android often won't until engagement heuristics pass.
    if (mobile || ios || android) {
      setOpen(true);
      return;
    }

    const prompted = runNativePrompt();
    if (!prompted) setOpen(true);
  };

  const dismissBanner = () => {
    setBannerDismissed(true);
    try {
      sessionStorage.setItem("chauff-install-banner-dismissed", "1");
    } catch {
      /* ignore */
    }
  };

  if (installed) return null;

  const canPrompt = Boolean(deferredPrompt || getCachedPrompt());
  // Show help banner on phones even without a native prompt event
  const showBanner =
    mounted &&
    !bannerDismissed &&
    !open &&
    (canPrompt || ios || (android && mobile));

  const steps = ios ? (
    <>
      <li className="flex gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 font-mono text-[11px] text-paper">
          1
        </span>
        <span>
          Tap the <strong className="font-medium text-paper">Share</strong> button
          in your browser
          {/crios|fxios|edgios/i.test(
            typeof navigator !== "undefined" ? navigator.userAgent : ""
          )
            ? " (Safari works best on iPhone)"
            : ""}
          .
        </span>
      </li>
      <li className="flex gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 font-mono text-[11px] text-paper">
          2
        </span>
        <span>
          Scroll down and tap{" "}
          <strong className="font-medium text-paper">Add to Home Screen</strong>.
        </span>
      </li>
      <li className="flex gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 font-mono text-[11px] text-paper">
          3
        </span>
        <span>
          Tap <strong className="font-medium text-paper">Add</strong> to install
          Chauff.
        </span>
      </li>
    </>
  ) : android ? (
    <>
      <li className="flex gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 font-mono text-[11px] text-paper">
          1
        </span>
        <span>
          Tap the <strong className="font-medium text-paper">⋮</strong> menu in
          Chrome.
        </span>
      </li>
      <li className="flex gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 font-mono text-[11px] text-paper">
          2
        </span>
        <span>
          Tap{" "}
          <strong className="font-medium text-paper">Install app</strong> or{" "}
          <strong className="font-medium text-paper">Add to Home screen</strong>.
        </span>
      </li>
      <li className="flex gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 font-mono text-[11px] text-paper">
          3
        </span>
        <span>Confirm to add Chauff to your home screen.</span>
      </li>
    </>
  ) : (
    <>
      <li className="flex gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 font-mono text-[11px] text-paper">
          1
        </span>
        <span>Open this site in Chrome or Edge.</span>
      </li>
      <li className="flex gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 font-mono text-[11px] text-paper">
          2
        </span>
        <span>
          Use the install icon in the address bar, or the browser menu →{" "}
          <strong className="font-medium text-paper">Install Chauff</strong>.
        </span>
      </li>
    </>
  );

  const modal =
    mounted && open
      ? createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-end justify-center sm:items-center sm:p-4"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute inset-0 bg-black/65"
              onClick={() => setOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="install-app-title"
              className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/10 bg-obsidian p-6 text-left shadow-[0_24px_80px_rgba(0,0,0,0.5)] sm:rounded-2xl md:p-7"
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
              <h2
                id="install-app-title"
                className="font-instrument text-[28px] leading-[1.1] tracking-[-0.02em] text-paper"
              >
                Get Chauff
              </h2>
              <p className="mt-3 font-body text-[14px] leading-[1.55] text-ash">
                {ios
                  ? "On iPhone, apps are added from Share → Add to Home Screen. Browsers can’t show a one-tap install popup."
                  : "Install Chauff on your home screen for a faster, app-like experience."}
              </p>

              {canPrompt ? (
                <button
                  type="button"
                  onClick={runNativePrompt}
                  disabled={busy}
                  className="mt-6 w-full rounded-buttons bg-paper px-4 py-3.5 font-body text-[15px] font-medium text-void transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {busy ? "Opening install…" : "Install app"}
                </button>
              ) : null}

              <ol className="mt-6 space-y-4 font-body text-[14px] leading-[1.5] text-frost">
                {steps}
              </ol>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-6 w-full rounded-buttons border border-white/20 px-4 py-3.5 font-body text-[15px] text-paper transition-colors hover:border-white/40"
              >
                Close
              </button>
            </div>
          </div>,
          document.body
        )
      : null;

  const banner =
    showBanner
      ? createPortal(
          <div
            className="fixed inset-x-0 bottom-0 z-[99998] p-3 sm:p-5"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <div className="mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-white/15 bg-void/95 px-4 py-3 shadow-[0_16px_48px_rgba(0,0,0,0.35)] backdrop-blur-md">
              <div className="min-w-0 flex-1">
                <p className="font-body text-[14px] font-medium text-paper">
                  Install Chauff
                </p>
                <p className="mt-0.5 font-body text-[12px] text-ash">
                  {ios
                    ? "Add to your Home Screen in a few taps."
                    : "Add the app for quicker booking."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (canPrompt) runNativePrompt();
                  else setOpen(true);
                }}
                disabled={busy}
                className="shrink-0 rounded-buttons bg-paper px-3.5 py-2.5 font-body text-[13px] font-medium text-void disabled:opacity-60"
              >
                {canPrompt ? "Install" : "How to"}
              </button>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={dismissBanner}
                className="shrink-0 px-1 font-body text-[18px] leading-none text-ash hover:text-paper"
              >
                ×
              </button>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleGetApp}
        className="inline-flex items-center gap-2 rounded-buttons border border-white/20 bg-transparent px-4 py-2.5 font-body text-[13px] text-paper transition-colors duration-200 hover:border-white/40 hover:bg-white/5 md:text-[14px]"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className="shrink-0"
        >
          <path
            d="M8 2v8m0 0L5.5 7.5M8 10l2.5-2.5M3 12.5V13a1 1 0 001 1h8a1 1 0 001-1v-.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Get the app
      </button>
      {modal}
      {banner}
    </div>
  );
}
