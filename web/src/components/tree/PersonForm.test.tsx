import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PersonForm } from './PersonForm';

describe('PersonForm validation', () => {
  it('shows an error when the given name is cleared', async () => {
    render(<PersonForm mode="create" onSubmit={vi.fn()} />);
    const input = screen.getByLabelText('Given name');
    fireEvent.change(input, { target: { value: 'Ada' } });
    fireEvent.change(input, { target: { value: '' } });
    expect(await screen.findByText('Given name is required')).toBeInTheDocument();
  });

  it('rejects a death date earlier than the birth date', async () => {
    render(<PersonForm mode="create" onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Given name'), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText('Birth date'), { target: { value: '1900-01-01' } });
    fireEvent.change(screen.getByLabelText('Death date'), { target: { value: '1899-01-01' } });
    expect(
      await screen.findByText('Death date must be on or after birth date'),
    ).toBeInTheDocument();
  });

  it('disables and clears the death date when marked living', async () => {
    render(<PersonForm mode="create" onSubmit={vi.fn()} />);
    const death = screen.getByLabelText('Death date') as HTMLInputElement;
    fireEvent.change(death, { target: { value: '1990-01-01' } });
    expect(death.value).toBe('1990-01-01');

    fireEvent.click(screen.getByRole('checkbox', { name: 'Living' }));

    expect(death).toBeDisabled();
    expect(death.value).toBe('');
  });

  it('submits birth name and birth place', async () => {
    const onSubmit = vi.fn();
    render(<PersonForm mode="create" onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('Given name'), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText('Birth name'), { target: { value: 'Byron' } });
    fireEvent.change(screen.getByLabelText('Birth place'), { target: { value: 'London' } });

    const submit = screen.getByRole('button', { name: 'Add person' });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ givenName: 'Ada', birthName: 'Byron', birthPlace: 'London' }),
    );
  });
});
