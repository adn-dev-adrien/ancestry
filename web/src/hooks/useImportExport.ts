import { useMutation, useQueryClient } from '@tanstack/react-query';
import { importIntoTree, importNewTree, type ExportPayload } from '@/services/importExport';

export function useImportExport() {
  const queryClient = useQueryClient();
  const invalidate = (treeId?: string) => {
    queryClient.invalidateQueries({ queryKey: ['trees'] });
    if (treeId) queryClient.invalidateQueries({ queryKey: ['tree', treeId] });
  };

  const importNew = useMutation({
    mutationFn: (payload: ExportPayload) => importNewTree(payload),
    onSuccess: (tree) => invalidate(tree.id),
  });

  const importReplace = useMutation({
    mutationFn: ({ treeId, payload }: { treeId: string; payload: ExportPayload }) =>
      importIntoTree(treeId, payload),
    onSuccess: (tree) => invalidate(tree.id),
  });

  return { importNew, importReplace };
}
