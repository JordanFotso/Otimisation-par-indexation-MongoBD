import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useRunBenchmark() {
  return useMutation({
    mutationFn: async ({ rps, duration }: { rps: number; duration: string }) => {
      const response = await api.post<{ output: string }>("/benchmark/run", { rps, duration });
      return response.data;
    },
  });
}
