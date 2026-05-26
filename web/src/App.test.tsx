import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the Ancestry header title', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Ancestry' })).toBeInTheDocument();
  });

  it('renders the New tree action', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /new tree/i })).toBeInTheDocument();
  });
});
