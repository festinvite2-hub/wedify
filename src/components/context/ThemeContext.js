import { createContext, useContext } from "react";

const ThemeContext = createContext(null);

function useTheme() {
  const value = useContext(ThemeContext);
  if (value === null) throw new Error("useTheme must be used within ThemeContext.Provider");
  return value;
}

export { ThemeContext, useTheme };
