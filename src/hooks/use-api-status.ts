import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ApiStatus {
  status: string;
  timestamp: string;
  message: string;
}

export function useApiStatus() {
  return useQuery({
    queryKey: ["api-status"],
    queryFn: async () => {
      const response = await api.get<ApiStatus>("/status");
      return response.data;
    },
    refetchInterval: 30000, // Vérifier toutes les 30s
  });
}
