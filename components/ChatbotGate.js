"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Routes where the Imgni chatbot must not intercept taps */
const HIDE_ON = ["/book", "/payment", "/trips", "/account", "/signin", "/signup"];

function shouldHide(pathname) {
  if (!pathname) return false;
  return HIDE_ON.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Hides the Imgni / voice assistant widget on booking and auth screens
 * so its high z-index layer can't block Search / Request taps.
 */
export default function ChatbotGate() {
  const pathname = usePathname();

  useEffect(() => {
    const hide = shouldHide(pathname);
    document.documentElement.classList.toggle("hide-imgni-chatbot", hide);

    const widget = document.getElementById("imgni-widget");
    if (widget) {
      widget.style.display = hide ? "none" : "";
      widget.style.pointerEvents = hide ? "none" : "";
      widget.setAttribute("aria-hidden", hide ? "true" : "false");
    }

    // Widget may mount after our first paint — keep watching briefly
    const observer = new MutationObserver(() => {
      const el = document.getElementById("imgni-widget");
      if (!el) return;
      if (hide) {
        el.style.display = "none";
        el.style.pointerEvents = "none";
        el.setAttribute("aria-hidden", "true");
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("hide-imgni-chatbot");
      const el = document.getElementById("imgni-widget");
      if (el) {
        el.style.display = "";
        el.style.pointerEvents = "";
        el.removeAttribute("aria-hidden");
      }
    };
  }, [pathname]);

  return null;
}
