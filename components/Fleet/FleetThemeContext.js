"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "chauff-fleet-theme";

/** Survives FleetShell remounts when navigating between console layouts */
let cachedTheme = null;

const FleetThemeContext = createContext({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
  ready: false,
});

export function FleetThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => cachedTheme || "dark");
  const [ready, setReady] = useState(() => cachedTheme != null);

  useEffect(() => {
    if (cachedTheme === "light" || cachedTheme === "dark") {
      setThemeState(cachedTheme);
      setReady(true);
      return;
    }
    let next = "dark";
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark") next = saved;
    } catch {
      // ignore
    }
    cachedTheme = next;
    setThemeState(next);
    setReady(true);
  }, []);

  const setTheme = (next) => {
    cachedTheme = next;
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <FleetThemeContext.Provider value={{ theme, setTheme, toggleTheme, ready }}>
      {children}
    </FleetThemeContext.Provider>
  );
}

export function useFleetTheme() {
  return useContext(FleetThemeContext);
}
