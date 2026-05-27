import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { LanguageSwitcher } from './LanguageSwitcher';

describe('LanguageSwitcher', () => {
  it('switches the language and persists the choice', () => {
    render(<LanguageSwitcher />);

    fireEvent.click(screen.getByRole('button', { name: 'en' }));

    expect(i18n.resolvedLanguage).toBe('en');
    expect(localStorage.getItem('ancestry.locale')).toBe('en');
  });

  it('marks the active locale as pressed', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByRole('button', { name: 'fr' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'en' })).toHaveAttribute('aria-pressed', 'false');
  });
});
