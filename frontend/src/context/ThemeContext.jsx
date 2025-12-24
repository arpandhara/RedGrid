import { createContext, useContext, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // FORCE DARK MODE: No state, no toggle, just execution.
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove any potential 'light' class and force 'dark'
    root.classList.remove("light");
    root.classList.add("dark");
    
    // Optional: Force local storage to dark in case other tabs check it
    localStorage.setItem("theme", "dark");
  }, []);

  // We provide an empty context or a fixed one since switching is disabled
  return (
    <ThemeContext.Provider value={{ theme: "dark", toggleTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);