import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { NodeProps } from '@xyflow/react';
import type { Person } from '@/services/types';
import type { PersonNode as PersonNodeType } from '@/utils/layout';

vi.mock('@xyflow/react', () => ({
  Handle: () => null,
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
  MarkerType: { ArrowClosed: 'arrowclosed' },
}));

// Imported after the mock so the component picks up the stubbed Handle.
import { PersonNode } from './PersonNode';

const person = (over: Partial<Person> = {}): Person => ({
  id: 'p1',
  treeId: 't',
  givenName: 'Ada',
  familyName: 'Lovelace',
  birthName: null,
  birthDate: '1815-12-10',
  deathDate: '1852-11-27',
  living: false,
  birthPlace: null,
  birthPlaceUncertain: false,
  gender: 'FEMALE',
  notes: null,
  x: null,
  y: null,
  createdAt: '',
  updatedAt: '',
  ...over,
});

function renderNode(over: Partial<Person> = {}, selected = false) {
  const props = { data: { person: person(over) }, selected } as unknown as NodeProps<PersonNodeType>;
  return render(<PersonNode {...props} />);
}

describe('PersonNode', () => {
  it('renders the full name and life span', () => {
    renderNode();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('1815 – 1852')).toBeInTheDocument();
  });

  it('applies the selection ring when selected', () => {
    const { container } = renderNode({}, true);
    expect(container.firstChild).toHaveClass('ring-primary');
  });

  it('shows the birth place with a "?" marker only when uncertain', () => {
    renderNode({ birthPlace: 'Paris', birthPlaceUncertain: true });
    expect(screen.getByText(/Paris \?/)).toBeInTheDocument();
  });

  it('tints the card by gender', () => {
    const female = renderNode({ gender: 'FEMALE' });
    expect(female.container.firstChild).toHaveClass('bg-pink-50');
    female.unmount();
    const male = renderNode({ gender: 'MALE' });
    expect(male.container.firstChild).toHaveClass('bg-blue-50');
  });
});
