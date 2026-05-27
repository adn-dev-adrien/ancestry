import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Relationship } from '@/services/types';
import { MarriageEditor } from './MarriageEditor';

const spouseRel: Relationship = {
  id: 'r1',
  treeId: 't',
  sourcePersonId: 'a',
  targetPersonId: 'b',
  type: 'SPOUSE',
  marriageDate: null,
  divorced: false,
  divorceDate: null,
  createdAt: '',
};

describe('MarriageEditor', () => {
  it('enables the divorce date only when divorced, and saves the values', () => {
    const onSave = vi.fn();
    render(<MarriageEditor relationship={spouseRel} onClose={vi.fn()} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText('Date de mariage'), { target: { value: '1990-06-01' } });

    const divorceDate = screen.getByLabelText('Date de divorce') as HTMLInputElement;
    expect(divorceDate).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Divorcé' }));
    expect(divorceDate).not.toBeDisabled();
    fireEvent.change(divorceDate, { target: { value: '2005-03-02' } });

    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(onSave).toHaveBeenCalledWith({
      marriageDate: '1990-06-01',
      divorced: true,
      divorceDate: '2005-03-02',
    });
  });
});
