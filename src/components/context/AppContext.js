import { createContext, useContext } from "react";

const AppContext = createContext(null);

function useApp() {
  const value = useContext(AppContext);
  if (value === null) throw new Error("useApp must be used within AppContext.Provider");
  return value;
}

export { AppContext, useApp };
