import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ExplainResponse {
  stage: string;
  totalDocsExamined: number;
  totalKeysExamined: number;
  executionTimeMillis: number;
  nReturned: number;
  raw: any;
}

export function useExecuteScenario() {
  return useMutation({
    mutationFn: async ({ strategy, ...filters }: { strategy: string; [key: string]: any }) => {
      const response = await api.get<ExplainResponse>(`/explain`, {
        params: { strategy, ...filters },
      });
      return response.data;
    },
  });
}

export function useExplain(strategy: string, email: string, enabled = true) {
  return useQuery({
    queryKey: ["explain", strategy, email],
    queryFn: async () => {
      const response = await api.get<ExplainResponse>(`/explain`, {
        params: { strategy, email },
      });
      return response.data;
    },
    enabled: enabled && !!email,
  });
}
