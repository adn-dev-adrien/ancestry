import { fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { Person, Relationship } from '@/services/types';
import { PersonDetailPanel } from './PersonDetailPanel';

// Keep CommuneInput hermetic (PersonForm pulls it in).
vi.mock('@/services/communes', () => ({
  searchCommunes: vi.fn().mockResolvedValue([]),
  communeLabel: (c: { nom: string; departement: string }) => `${c.nom} (${c.departement})`,
}));

// Force the desktop branch (Sheet) for predictable rendering.
vi.mock('@/hooks/useMediaQuery', () => ({ useMediaQuery: () => true }));

const person = (over: Partial<Person> = {}): Person => ({
  id: 'p1',
  treeId: 't',
  givenName: 'Ada',
  additionalGivenNames: null,
  familyName: 'Lovelace',
  birthName: null,
  birthDate: null,
  deathDate: null,
  living: false,
  birthPlace: null,
  birthPlaceUncertain: false,
  deathPlace: null,
  deathPlaceUncertain: false,
  photo: null,
  gender: null,
  notes: null,
  x: null,
  y: null,
  createdAt: '',
  updatedAt: '',
  ...over,
});

const ada = person({ id: 'ada', givenName: 'Ada', familyName: 'Lovelace' });
const parent = person({ id: 'mom', givenName: 'Annabella', familyName: 'Milbanke' });
const child = person({ id: 'kid', givenName: 'Byron', familyName: 'King' });
const spouse = person({ id: 'will', givenName: 'William', familyName: 'King' });

const parentRel: Relationship = {
  id: 'pc1',
  treeId: 't',
  sourcePersonId: 'mom',
  targetPersonId: 'ada',
  type: 'PARENT_CHILD',
  marriageDate: null,
  divorced: false,
  divorceDate: null,
  createdAt: '',
};
const childRel: Relationship = { ...parentRel, id: 'pc2', sourcePersonId: 'ada', targetPersonId: 'kid' };
const spouseRel: Relationship = {
  ...parentRel,
  id: 'sp1',
  sourcePersonId: 'ada',
  targetPersonId: 'will',
  type: 'SPOUSE',
};

function renderPanel(extra: Partial<React.ComponentProps<typeof PersonDetailPanel>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PersonDetailPanel
        open
        mode="edit"
        person={ada}
        persons={[ada, parent, child, spouse]}
        relationships={[parentRel, childRel, spouseRel]}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        {...extra}
      />
    </QueryClientProvider>,
  );
}

describe('PersonDetailPanel trash buttons', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });
  afterEach(() => vi.restoreAllMocks());

  it('renders a trash button next to each relative when callbacks are provided', () => {
    renderPanel({
      onDeleteParent: vi.fn(),
      onDeleteChild: vi.fn(),
      onDeleteSpouse: vi.fn(),
    });
    // One per relative (mom, kid, will) — plus the form's Delete button is excluded by aria-label.
    const trashButtons = screen.getAllByRole('button', { name: 'Supprimer cette relation' });
    expect(trashButtons).toHaveLength(3);
  });

  it('does not render trash buttons when no delete callback is provided', () => {
    renderPanel();
    expect(screen.queryAllByRole('button', { name: 'Supprimer cette relation' })).toHaveLength(0);
  });

  it('calls onDeleteParent with (personId, parentId) when the parent trash is clicked', () => {
    const onDeleteParent = vi.fn();
    renderPanel({ onDeleteParent });
    // Scope to the Parents section to grab the right trash button.
    const parentsHeading = screen.getByText('Parents');
    const section = parentsHeading.parentElement!;
    fireEvent.click(within(section).getByRole('button', { name: 'Supprimer cette relation' }));
    expect(onDeleteParent).toHaveBeenCalledWith('ada', 'mom');
  });

  it('calls onDeleteChild with (personId, childId) when the child trash is clicked', () => {
    const onDeleteChild = vi.fn();
    renderPanel({ onDeleteChild });
    const childrenHeading = screen.getByText('Enfants');
    const section = childrenHeading.parentElement!;
    fireEvent.click(within(section).getByRole('button', { name: 'Supprimer cette relation' }));
    expect(onDeleteChild).toHaveBeenCalledWith('ada', 'kid');
  });

  it('calls onDeleteSpouse with the relationship and does not open the marriage editor', () => {
    const onDeleteSpouse = vi.fn();
    const onEditMarriage = vi.fn();
    renderPanel({ onDeleteSpouse, onEditMarriage });
    const spousesHeading = screen.getByText('Conjoints');
    const section = spousesHeading.parentElement!;
    fireEvent.click(within(section).getByRole('button', { name: 'Supprimer cette relation' }));
    expect(onDeleteSpouse).toHaveBeenCalledWith(spouseRel);
    // The row click handler must not have fired (stopPropagation in the trash button).
    expect(onEditMarriage).not.toHaveBeenCalled();
  });
});
