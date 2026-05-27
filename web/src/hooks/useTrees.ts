import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTree, deleteTree, listTrees, updateTree } from '@/services/trees';

export function useTrees() {
  return useQuery({ queryKey: ['trees'], queryFn: listTrees });
}

export function useCreateTree() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTree,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trees'] }),
  });
}

export function useUpdateTree() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; title?: string; description?: string | null }) =>
      updateTree(id, body),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['trees'] });
      queryClient.invalidateQueries({ queryKey: ['tree', id] });
    },
  });
}

export function useDeleteTree() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTree,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trees'] }),
  });
}
