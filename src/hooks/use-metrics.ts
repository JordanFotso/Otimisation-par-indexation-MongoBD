import { useQuery, keepPreviousData } from "@tanstack/react-query";
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
    refetchInterval: 10000,
    placeholderData: keepPreviousData,
  });
}

export interface TimeseriesPoint {
  t: string;
  no_index: number;
  no_index_rps: number;
  single_index: number;
  single_index_rps: number;
  compound_index: number;
  compound_index_rps: number;
}

export function useTimeseries(start?: number, duration?: number) {
  return useQuery({
    queryKey: ["metrics", "timeseries", start, duration],
    queryFn: async () => {
      const response = await api.get<TimeseriesPoint[]>("/metrics/timeseries", {
        params: { start, duration }
      });
      return response.data;
    },
    refetchInterval: 3000,
    placeholderData: keepPreviousData,
  });
}

export interface ThroughputMetric {
  no_index: number;
  single_index: number;
  compound_index: number;
  total: number;
}

export function useThroughput() {
  return useQuery({
    queryKey: ["metrics", "throughput"],
    queryFn: async () => {
      const response = await api.get<ThroughputMetric>("/metrics/throughput");
      return response.data;
    },
    refetchInterval: 2000,
    placeholderData: keepPreviousData,
  });
}
