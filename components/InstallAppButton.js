"use client";

import React, { useEffect, useState } from "react";

/** Capture beforeinstallprompt early — it can fire before React mounts. */
let cachedPrompt = null;
const promptListeners = new Set();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    cachedPrompt = e;
    promptListeners.forEach((fn) => fn(e));
  });
  window.addEventListener("appinstalled", () => {
    cachedPrompt = null;
    promptListeners.forEach((fn) => fn(null));
  });
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

function isSecure() {
  if (typeof window === "undefined") return false;
  return (
    window.isSecureContext ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

/**
 * Triggers the browser PWA install prompt when available.
 * Always opens a clear install panel so the button never feels dead.
 */
export default function InstallAppButton({ className = "" }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return undefined;
    }

    setDeferredPrompt(cachedPrompt);

    const onPrompt = (event) => setDeferredPrompt(event);
    const onInstalled = () => {
      setDeferredPrompt(null);
      setInstalled(true);
      setOpen(false);
    };

    promptListeners.add(onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      promptListeners.delete(onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (installed) return null;

  const handleInstall = async () => {
    const promptEvent = deferredPrompt || cachedPrompt;
    if (!promptEvent) return;

    setBusy(true);
    try {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      cachedPrompt = null;
      setDeferredPrompt(null);
      if (outcome === "accepted") {
        setInstalled(true);
        setOpen(false);
      }
    } finally {
      setBusy(false);
    }
  };

  const ios = isIos();
  const android = isAndroid();
  const canPrompt = Boolean(deferredPrompt || cachedPrompt);
  const secure = isSecure();

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(true)}
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

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
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
                onClick={handleInstall}
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
                  {!secure ? (
                    <li className="text-ash">
                      Note: one-tap install needs HTTPS. On a local network IP
                      over HTTP, use Add to Home screen from the browser menu.
                    </li>
                  ) : null}
                </>
              ) : (
                <>
                  <li>1. Open this site in Chrome or Edge.</li>
                  <li>
                    2. Use the install icon in the address bar, or the browser
                    menu → Install Chauff.
                  </li>
                  {!secure ? (
                    <li className="text-ash">
                      Tip: for full install support, use localhost or an HTTPS
                      URL.
                    </li>
                  ) : null}
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
        </div>
      ) : null}
    </div>
  );
}
