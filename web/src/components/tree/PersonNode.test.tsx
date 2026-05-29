import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NodeProps } from '@xyflow/react';
import type { Person } from '@/services/types';
import type { PersonNode as PersonNodeType } from '@/utils/layout';

const store = vi.hoisted(() => ({ zoom: 1 }));

vi.mock('@xyflow/react', () => ({
  Handle: () => null,
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
  MarkerType: { ArrowClosed: 'arrowclosed' },
  useStore: (selector: (s: { transform: number[] }) => unknown) =>
    selector({ transform: [0, 0, store.zoom] }),
}));

// Imported after the mock so the component picks up the stubbed Handle/useStore.
import { PersonNode } from './PersonNode';

const person = (over: Partial<Person> = {}): Person => ({
  id: 'p1',
  treeId: 't',
  givenName: 'Ada',
  additionalGivenNames: null,
  familyName: 'Lovelace',
  birthName: null,
  birthDate: '1815-12-10',
  deathDate: '1852-11-27',
  living: false,
  birthPlace: null,
  birthPlaceUncertain: false,
  deathPlace: null,
  deathPlaceUncertain: false,
  photo: null,
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

beforeEach(() => {
  store.zoom = 1; // full detail by default
});
afterEach(() => {
  store.zoom = 1;
});

describe('PersonNode (full detail)', () => {
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

describe('PersonNode (level of detail)', () => {
  it('shows only the name when zoomed out', () => {
    store.zoom = 0.4;
    const { container } = renderNode({ photo: 'data:image/jpeg;base64,x' });
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.queryByText('1815 – 1852')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    // Name font is counter-scaled up when zoomed out (14 / 0.4 = 35px).
    expect(screen.getByText('Ada Lovelace')).toHaveStyle({ fontSize: '35px' });
  });

  it('adds the photo but not the details at medium zoom', () => {
    store.zoom = 0.7;
    const { container } = renderNode({ photo: 'data:image/jpeg;base64,x' });
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(container.querySelector('img')).not.toBeNull();
    expect(screen.queryByText('1815 – 1852')).toBeNull();
  });

  it('shows the life span at full zoom', () => {
    store.zoom = 1;
    renderNode();
    expect(screen.getByText('1815 – 1852')).toBeInTheDocument();
  });
});
