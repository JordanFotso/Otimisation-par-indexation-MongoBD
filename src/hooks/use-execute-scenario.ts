import { useMutation } from "@tanstack/react-query";
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
