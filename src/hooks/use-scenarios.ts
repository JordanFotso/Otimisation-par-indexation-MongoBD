import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Scenario {
  id: string;
  name: string;
  method: string;
  path: string;
  description: string;
  filters: string[];
}

export function useScenarios() {
  return useQuery({
    queryKey: ["scenarios"],
    queryFn: async () => {
      const response = await api.get<Scenario[]>("/scenarios");
      return response.data;
    },
  });
}
