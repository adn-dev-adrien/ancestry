import { describe, expect, it } from 'vitest';
import i18n from './index';

describe('i18n', () => {
  it('defaults to French', () => {
    expect(i18n.t('home.newTree')).toBe('Nouvel arbre');
  });

  it('returns English strings after switching to en', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('home.newTree')).toBe('New tree');
    await i18n.changeLanguage('fr');
  });

  it('pluralizes the people count per locale', () => {
    expect(i18n.t('home.people', { count: 1 })).toBe('1 personne');
    expect(i18n.t('home.people', { count: 3 })).toBe('3 personnes');
  });
});
