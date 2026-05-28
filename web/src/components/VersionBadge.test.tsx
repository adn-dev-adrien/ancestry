import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VersionBadge } from './VersionBadge';

describe('VersionBadge', () => {
  it('renders a build label', () => {
    render(<VersionBadge />);
    expect(screen.getByText(/^build /)).toBeInTheDocument();
  });
});
