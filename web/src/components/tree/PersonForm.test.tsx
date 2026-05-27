import type { ReactElement } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import type { Person } from '@/services/types';

vi.mock('@/utils/image', () => ({
  fileToAvatarDataUrl: vi.fn().mockResolvedValue('data:image/jpeg;base64,DROPPED'),
}));

// Keep the birth-place autocomplete hermetic (no real network).
vi.mock('@/services/communes', () => ({
  searchCommunes: vi.fn().mockResolvedValue([]),
  communeLabel: (c: { nom: string; departement: string }) => `${c.nom} (${c.departement})`,
}));

import { PersonForm } from './PersonForm';

// PersonForm renders CommuneInput (TanStack useQuery), so a client is required.
function renderForm(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const personWithPhoto: Person = {
  id: 'p1',
  treeId: 't',
  givenName: 'Ada',
  familyName: null,
  birthName: null,
  birthDate: null,
  deathDate: null,
  living: false,
  birthPlace: null,
  birthPlaceUncertain: false,
  photo: 'data:image/jpeg;base64,abc',
  gender: null,
  notes: null,
  x: null,
  y: null,
  createdAt: '',
  updatedAt: '',
};

// UI defaults to French (see test setup).
describe('PersonForm validation', () => {
  it('shows an error when the given name is cleared', async () => {
    renderForm(<PersonForm mode="create" onSubmit={vi.fn()} />);
    const input = screen.getByLabelText('Prénom');
    fireEvent.change(input, { target: { value: 'Ada' } });
    fireEvent.change(input, { target: { value: '' } });
    expect(await screen.findByText('Le prénom est requis')).toBeInTheDocument();
  });

  it('rejects a death date earlier than the birth date', async () => {
    renderForm(<PersonForm mode="create" onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText('Date de naissance'), { target: { value: '1900-01-01' } });
    fireEvent.change(screen.getByLabelText('Date de décès'), { target: { value: '1899-01-01' } });
    expect(
      await screen.findByText('La date de décès doit être postérieure ou égale à la date de naissance'),
    ).toBeInTheDocument();
  });

  it('disables and clears the death date when marked living', async () => {
    renderForm(<PersonForm mode="create" onSubmit={vi.fn()} />);
    const death = screen.getByLabelText('Date de décès') as HTMLInputElement;
    fireEvent.change(death, { target: { value: '1990-01-01' } });
    expect(death.value).toBe('1990-01-01');

    fireEvent.click(screen.getByRole('checkbox', { name: 'En vie (pas de date de décès)' }));

    expect(death).toBeDisabled();
    expect(death.value).toBe('');
  });

  it('submits birth name and birth place', async () => {
    const onSubmit = vi.fn();
    renderForm(<PersonForm mode="create" onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText('Nom de naissance'), { target: { value: 'Byron' } });
    fireEvent.change(screen.getByLabelText('Lieu de naissance'), { target: { value: 'London' } });

    const submit = screen.getByRole('button', { name: 'Ajouter' });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ givenName: 'Ada', birthName: 'Byron', birthPlace: 'London' }),
    );
  });

  it('shows the photo preview and removes it', () => {
    const { container } = renderForm(
      <PersonForm mode="edit" person={personWithPhoto} onSubmit={vi.fn()} />,
    );
    expect(container.querySelector('img')).toHaveAttribute('src', personWithPhoto.photo!);

    fireEvent.click(screen.getByRole('button', { name: 'Retirer la photo' }));

    expect(container.querySelector('img')).toBeNull();
  });

  it('accepts a photo dropped onto the photo zone', async () => {
    const { container } = renderForm(<PersonForm mode="create" onSubmit={vi.fn()} />);
    const file = new File(['x'], 'face.png', { type: 'image/png' });

    fireEvent.drop(screen.getByText('Glissez une photo ici'), {
      dataTransfer: { files: [file] },
    });

    await waitFor(() =>
      expect(container.querySelector('img')).toHaveAttribute('src', 'data:image/jpeg;base64,DROPPED'),
    );
  });
});
