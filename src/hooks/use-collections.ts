import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface CollectionInfo {
  key: string;
  name: string;
  label: string;
  index: string;
  documents: number;
  indexSize: string;
  color: string;
  status: "critical" | "warning" | "healthy";
}

export function useCollections() {
  return useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const response = await api.get<CollectionInfo[]>("/collections");
      return response.data;
    },
  });
}
