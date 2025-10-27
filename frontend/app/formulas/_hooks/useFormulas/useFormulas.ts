"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formulaApi } from "@/lib/api";

interface UseFormulasOptions {
  enabled?: boolean;
}

export function useFormulas(options?: UseFormulasOptions) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["formulas"],
    queryFn: () => formulaApi.list(),
    enabled: options?.enabled !== false,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => formulaApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formulas"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      formulaApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formulas"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => formulaApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formulas"] });
    },
  });

  return {
    ...query,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
