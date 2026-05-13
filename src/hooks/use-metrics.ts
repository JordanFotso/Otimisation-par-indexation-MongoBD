import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ResponseTimeMetric {
  collection: string;
  min: number;
  avg: number;
  p95: number;
  p99: number;
  max: number;
}

export function useResponseTime() {
  return useQuery({
    queryKey: ["metrics", "response-time"],
    queryFn: async () => {
      const response = await api.get<ResponseTimeMetric[]>("/metrics/response-time");
      return response.data;
    },
    // On rafraîchit toutes les 10 secondes pour voir l'évolution
    refetchInterval: 10000,
  });
}
