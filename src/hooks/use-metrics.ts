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

export interface TimeseriesPoint {
  t: number;
  no_index: number;
  single_index: number;
  compound_index: number;
}

export function useTimeseries() {
  return useQuery({
    queryKey: ["metrics", "timeseries"],
    queryFn: async () => {
      const response = await api.get<TimeseriesPoint[]>("/metrics/timeseries");
      return response.data;
    },
    refetchInterval: 5000, // Rafraîchissement plus fréquent pour le graphique temporel
  });
}
