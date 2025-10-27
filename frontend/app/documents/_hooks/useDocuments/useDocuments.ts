"use client";

import { useQuery } from "@tanstack/react-query";
import { documentApi } from "@/lib/api";

interface UseDocumentsOptions {
  enabled?: boolean;
}

export function useDocuments(options?: UseDocumentsOptions) {
  return useQuery({
    queryKey: ["documents"],
    queryFn: () => documentApi.list(),
    enabled: options?.enabled !== false,
  });
}
