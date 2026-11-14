import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/utils/RestAPI";
const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${BASE_URL}/api/auth/me`, { withCredentials: true })
      // Only a real user object counts (a misconfigured API URL can answer 200 with an HTML page)
      .then(res => setUser(res.data && typeof res.data === "object" && res.data.id ? res.data : null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
