import { useState, useEffect } from "react";
import { getUser, logout } from "@/lib/api";

interface UserInfo {
  id: number;
  account: string;
  nickname: string;
}

export function useAuth() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUser();
    setUser(u);
    setLoading(false);
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  return { user, loading, isAuthenticated: !!user, logout: handleLogout };
}
