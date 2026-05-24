import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ComparisonData {
  radar: {
    axis: string;
    no_index: number;
    single_index: number;
    compound_index: number;
  }[];
  writePerf: {
    op: string;
    no_index: number;
    single_index: number;
    compound_index: number;
  }[];
}

export function useComparison() {
  return useQuery({
    queryKey: ["metrics", "comparison"],
    queryFn: async () => {
      const response = await api.get<ComparisonData>("/metrics/comparison");
      return response.data;
    },
    placeholderData: keepPreviousData,
  });
}
