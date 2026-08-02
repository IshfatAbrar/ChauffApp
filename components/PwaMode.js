"use client";

import { useEffect } from "react";
import { isPwaStandalone } from "../lib/pwa";

/**
 * Marks <html> with .pwa-standalone so CSS can hide marketing chrome
 * without waiting on React (covers iOS navigator.standalone too).
 */
export default function PwaMode() {
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      root.classList.toggle("pwa-standalone", isPwaStandalone());
    };
    sync();

    const mqStandalone = window.matchMedia("(display-mode: standalone)");
    const mqFullscreen = window.matchMedia("(display-mode: fullscreen)");
    mqStandalone.addEventListener?.("change", sync);
    mqFullscreen.addEventListener?.("change", sync);

    return () => {
      mqStandalone.removeEventListener?.("change", sync);
      mqFullscreen.removeEventListener?.("change", sync);
      root.classList.remove("pwa-standalone");
    };
  }, []);

  return null;
}
