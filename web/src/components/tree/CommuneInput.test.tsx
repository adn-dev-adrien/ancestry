import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/services/communes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/communes')>();
  return {
    ...actual,
    searchCommunes: vi
      .fn()
      .mockResolvedValue([{ nom: 'Lyon', departement: 'Rhône', codePostal: '69001' }]),
  };
});

import { CommuneInput } from './CommuneInput';

function Harness({ onChange }: { onChange: (v: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <CommuneInput
      value={value}
      onChange={(v) => {
        setValue(v);
        onChange(v);
      }}
    />
  );
}

function renderInput(onChange: (v: string) => void) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Harness onChange={onChange} />
    </QueryClientProvider>,
  );
}

describe('CommuneInput', () => {
  it('suggests communes and stores "Name (Department)" on pick', async () => {
    const onChange = vi.fn();
    renderInput(onChange);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'lyon' } });

    const row = await screen.findByRole('button', { name: /Lyon/ });
    fireEvent.mouseDown(row);

    expect(onChange).toHaveBeenLastCalledWith('Lyon (Rhône)');
  });

  it('passes manual typing through unchanged', () => {
    const onChange = vi.fn();
    renderInput(onChange);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Atlantide' } });
    expect(onChange).toHaveBeenCalledWith('Atlantide');
  });
});
