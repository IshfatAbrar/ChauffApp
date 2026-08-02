"use client";

import React, { useEffect, useState } from "react";
import FleetSidebar from "./FleetSidebar";
import { FleetThemeProvider, useFleetTheme } from "./FleetThemeContext";

const STORAGE_KEY = "chauff-fleet-sidebar-collapsed";

function FleetShellInner({ children }) {
  const { theme, ready: themeReady } = useFleetTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved != null) {
        setCollapsed(saved === "1");
      } else if (window.matchMedia("(max-width: 768px)").matches) {
        setCollapsed(true);
      }
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <div
      className="fleet-console flex min-h-screen bg-void font-body text-paper"
      data-theme={themeReady ? theme : "dark"}
    >
      <div className={ready ? "" : "invisible"} aria-hidden={!ready}>
        <FleetSidebar collapsed={collapsed} onToggle={toggle} />
      </div>
      <div className="min-w-0 flex-1 overflow-x-hidden">{children}</div>
    </div>
  );
}

export default function FleetShell({ children }) {
  return (
    <FleetThemeProvider>
      <FleetShellInner>{children}</FleetShellInner>
    </FleetThemeProvider>
  );
}
