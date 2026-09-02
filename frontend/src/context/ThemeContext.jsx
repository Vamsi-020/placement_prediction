import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const THEMES = [
  {
    id: "dark",
    name: "Midnight Slate",
    description: "Deep dark futuristic theme with electric blue accents",
    icon: "🌙",
    primary: "#3b82f6",
    bg: "#0b0f19",
  },
  {
    id: "light",
    name: "Crystal Light",
    description: "Clean, ultra-crisp modern light workspace",
    icon: "☀️",
    primary: "#2563eb",
    bg: "#f8fafc",
  },
  {
    id: "cyberpunk",
    name: "Cyber Neon",
    description: "High-contrast synthwave neon purple & cyan glow",
    icon: "⚡",
    primary: "#a855f7",
    bg: "#090514",
  },
  {
    id: "emerald",
    name: "Forest Emerald",
    description: "Luxurious emerald green & mint professional vibe",
    icon: "🌿",
    primary: "#10b981",
    bg: "#05140f",
  },
  {
    id: "indigo",
    name: "Sunset Indigo",
    description: "Warm royal indigo with rose gold gradients",
    icon: "🌆",
    primary: "#6366f1",
    bg: "#0b0c20",
  },
];

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem("placement_theme") || "dark";
  });

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem("placement_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const currentIndex = THEMES.findIndex((t) => t.id === theme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setTheme(THEMES[nextIndex].id);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        availableThemes: THEMES,
        currentThemeMeta: THEMES.find((t) => t.id === theme) || THEMES[0],
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeContext;
