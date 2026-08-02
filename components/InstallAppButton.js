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

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isAndroid() {
  if (typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent);
}

/**
 * Footer CTA + optional banner. Uses early-captured beforeinstallprompt
 * (window.__chauffDeferredPrompt from layout) so the native prompt works.
 */
export default function InstallAppButton({ className = "" }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

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

    setDeferredPrompt(getCachedPrompt());

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

  const runNativePrompt = async () => {
    const promptEvent = deferredPrompt || getCachedPrompt();
    if (!promptEvent?.prompt) return false;

    setBusy(true);
    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      setCachedPrompt(null);
      setDeferredPrompt(null);
      if (outcome === "accepted") {
        setInstalled(true);
        setOpen(false);
      }
      return true;
    } catch (err) {
      console.error("Install prompt failed:", err);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleGetApp = async () => {
    const prompted = await runNativePrompt();
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
  const ios = isIos();
  const android = isAndroid();
  const showBanner = mounted && canPrompt && !bannerDismissed && !open;

  const modal =
    mounted && open
      ? createPortal(
          <div className="fixed inset-0 z-[9999] flex items-end justify-center p-4 sm:items-center">
            <button
              type="button"
              aria-label="Close"
              className="absolute inset-0 bg-black/60"
              onClick={() => setOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="install-app-title"
              className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-obsidian p-6 text-left shadow-[0_24px_80px_rgba(0,0,0,0.45)] md:p-7"
            >
              <h2
                id="install-app-title"
                className="font-instrument text-[28px] leading-[1.1] tracking-[-0.02em] text-paper"
              >
                Get Chauff
              </h2>
              <p className="mt-3 font-body text-[14px] leading-[1.55] text-ash">
                Install Chauff on your home screen for a faster, app-like
                experience.
              </p>

              {canPrompt ? (
                <button
                  type="button"
                  onClick={runNativePrompt}
                  disabled={busy}
                  className="mt-6 w-full rounded-buttons bg-paper px-4 py-3 font-body text-[14px] font-medium text-void transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {busy ? "Opening install…" : "Install app"}
                </button>
              ) : null}

              <ol className="mt-6 space-y-3 font-body text-[14px] leading-[1.5] text-frost">
                {ios ? (
                  <>
                    <li>1. Tap the Share button in Safari.</li>
                    <li>2. Scroll and tap Add to Home Screen.</li>
                    <li>3. Tap Add to confirm.</li>
                  </>
                ) : android ? (
                  <>
                    <li>1. Open the Chrome menu (⋮).</li>
                    <li>2. Tap Install app or Add to Home screen.</li>
                  </>
                ) : (
                  <>
                    <li>1. Open this site in Chrome or Edge.</li>
                    <li>
                      2. Use the install icon in the address bar, or the browser
                      menu → Install Chauff.
                    </li>
                  </>
                )}
              </ol>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-6 w-full rounded-buttons border border-white/20 px-4 py-3 font-body text-[14px] text-paper transition-colors hover:border-white/40"
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
          <div className="fixed inset-x-0 bottom-0 z-[9998] p-4 sm:p-5">
            <div className="mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-white/15 bg-void/95 px-4 py-3 shadow-[0_16px_48px_rgba(0,0,0,0.35)] backdrop-blur-md">
              <div className="min-w-0 flex-1">
                <p className="font-body text-[14px] font-medium text-paper">
                  Install Chauff
                </p>
                <p className="mt-0.5 font-body text-[12px] text-ash">
                  Add the app to your home screen for quicker booking.
                </p>
              </div>
              <button
                type="button"
                onClick={runNativePrompt}
                disabled={busy}
                className="shrink-0 rounded-buttons bg-paper px-3.5 py-2 font-body text-[13px] font-medium text-void disabled:opacity-60"
              >
                Install
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
