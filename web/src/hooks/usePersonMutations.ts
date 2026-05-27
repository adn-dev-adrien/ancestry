import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPerson, deletePerson, updatePerson, type PersonInput } from '@/services/persons';
import type { TreeWithGraph } from '@/services/types';

export function usePersonMutations(treeId: string) {
  const queryClient = useQueryClient();
  const key = ['tree', treeId];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

  const create = useMutation({
    mutationFn: (body: PersonInput) => createPerson(treeId, body),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Partial<PersonInput>) =>
      updatePerson(id, body),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deletePerson(id),
    onSuccess: invalidate,
  });

  // Position drags persist via PATCH with an optimistic cache update so the node
  // stays where it was dropped while the request is in flight.
  const savePosition = useMutation({
    mutationFn: ({ id, x, y }: { id: string; x: number; y: number }) =>
      updatePerson(id, { x, y }),
    onMutate: async ({ id, x, y }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<TreeWithGraph>(key);
      if (previous) {
        queryClient.setQueryData<TreeWithGraph>(key, {
          ...previous,
          persons: previous.persons.map((p) => (p.id === id ? { ...p, x, y } : p)),
        });
      }
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: invalidate,
  });

  return { create, update, remove, savePosition };
}
