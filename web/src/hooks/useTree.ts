import { useQuery } from '@tanstack/react-query';
import { getTree } from '@/services/trees';

export function useTree(treeId: string) {
  return useQuery({
    queryKey: ['tree', treeId],
    queryFn: () => getTree(treeId),
    enabled: Boolean(treeId),
  });
}
