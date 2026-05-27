import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Person } from '@/services/types';

const { fitView } = vi.hoisted(() => ({ fitView: vi.fn() }));
vi.mock('@xyflow/react', () => ({
  useReactFlow: () => ({ fitView }),
}));

import { TreeSearch } from './TreeSearch';

const person = (id: string, givenName: string, familyName: string | null = null): Person => ({
  id,
  treeId: 't',
  givenName,
  familyName,
  birthName: null,
  birthDate: null,
  deathDate: null,
  living: false,
  birthPlace: null,
  birthPlaceUncertain: false,
  gender: null,
  notes: null,
  x: null,
  y: null,
  createdAt: '',
  updatedAt: '',
});

const people = [person('1', 'Ada', 'Lovelace'), person('2', 'Bob', 'Martin')];

describe('TreeSearch', () => {
  it('lists matches and selects one', async () => {
    const onSelect = vi.fn();
    render(<TreeSearch persons={people} onSelect={onSelect} />);

    const input = screen.getByPlaceholderText('Rechercher une personne…') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Ada' } });

    const row = await screen.findByRole('button', { name: /Ada Lovelace/ });
    fireEvent.mouseDown(row);

    expect(onSelect).toHaveBeenCalledWith('1');
    expect(fitView).toHaveBeenCalledWith(
      expect.objectContaining({ nodes: [{ id: '1' }] }),
    );
    expect(input.value).toBe('');
  });

  it('shows a no-results message', () => {
    render(<TreeSearch persons={people} onSelect={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('Rechercher une personne…'), {
      target: { value: 'zzz' },
    });
    expect(screen.getByText('Aucun résultat')).toBeInTheDocument();
  });
});
