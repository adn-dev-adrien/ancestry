import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createRelationship, deleteRelationship } from '@/services/relationships';
import type { RelationshipType } from '@/services/types';

export function useRelationshipMutations(treeId: string) {
  const queryClient = useQueryClient();
  const key = ['tree', treeId];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

  const create = useMutation({
    mutationFn: (body: {
      sourcePersonId: string;
      targetPersonId: string;
      type: RelationshipType;
    }) => createRelationship(treeId, body),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteRelationship(id),
    onSuccess: invalidate,
  });

  return { create, remove };
}
