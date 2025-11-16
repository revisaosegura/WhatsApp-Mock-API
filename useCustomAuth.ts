import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";

export function useCustomAuth() {
  const { data: user, isLoading, error, refetch } = trpc.auth.me.useQuery();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!user);
  }, [user]);

  return {
    user,
    loading: isLoading,
    error,
    isAuthenticated,
    refetch,
  };
}
