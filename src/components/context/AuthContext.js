import { createContext, useContext } from "react";

const AuthContext = createContext(null);

function useAuth() {
  const value = useContext(AuthContext);
  if (value === null) throw new Error("useAuth must be used within AuthContext.Provider");
  return value;
}

export { AuthContext, useAuth };
