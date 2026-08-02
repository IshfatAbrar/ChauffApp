"use client";

import { useEffect, useState } from "react";
import { isPwaStandalone } from "../lib/pwa";

/** Client-side PWA/standalone detection (false until mounted). */
export default function useIsPwa() {
  const [isPwa, setIsPwa] = useState(false);

  useEffect(() => {
    const update = () => {
      setIsPwa(
        isPwaStandalone() ||
          document.documentElement.classList.contains("pwa-standalone")
      );
    };
    update();

    const mqStandalone = window.matchMedia("(display-mode: standalone)");
    const mqFullscreen = window.matchMedia("(display-mode: fullscreen)");
    const onChange = () => update();

    mqStandalone.addEventListener?.("change", onChange);
    mqFullscreen.addEventListener?.("change", onChange);

    return () => {
      mqStandalone.removeEventListener?.("change", onChange);
      mqFullscreen.removeEventListener?.("change", onChange);
    };
  }, []);

  return isPwa;
}
