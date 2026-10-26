/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from "react";
import { loginAccount } from "../api/auth.js";

const AuthContext = createContext(null);

function savedAccount() {
  try {
    return JSON.parse(localStorage.getItem("rollcall-account") || "null");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(savedAccount);

  async function login(credentials) {
    const result = await loginAccount(credentials);

    localStorage.setItem("rollcall-token", result.token);
    localStorage.setItem("rollcall-account", JSON.stringify(result.account));
    setAccount(result.account);
  }

  function logout() {
    localStorage.removeItem("rollcall-token");
    localStorage.removeItem("rollcall-account");
    setAccount(null);
  }

  const value = useMemo(
    () => ({ account, login, logout }),
    [account]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}