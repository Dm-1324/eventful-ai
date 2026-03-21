import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "claude" | "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: "claude", setTheme: () => {} });

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem("athena-theme") as Theme) || "claude";
  });

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("ai-event-theme", t);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-claude", "theme-dark", "theme-light");
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
