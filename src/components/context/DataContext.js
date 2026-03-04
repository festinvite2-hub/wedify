import { createContext, useContext } from "react";

const DataContext = createContext(null);

function useData() {
  const value = useContext(DataContext);
  if (value === null) throw new Error("useData must be used within DataContext.Provider");
  return value;
}

export { DataContext, useData };
