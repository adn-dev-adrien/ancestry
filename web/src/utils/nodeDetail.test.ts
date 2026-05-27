import { describe, expect, it } from 'vitest';
import { nodeDetailLevel } from './nodeDetail';

describe('nodeDetailLevel', () => {
  it('is compact below the medium threshold', () => {
    expect(nodeDetailLevel(0.4)).toBe('compact');
    expect(nodeDetailLevel(0.54)).toBe('compact');
  });

  it('is medium between the thresholds', () => {
    expect(nodeDetailLevel(0.55)).toBe('medium');
    expect(nodeDetailLevel(0.84)).toBe('medium');
  });

  it('is full at or above the full threshold', () => {
    expect(nodeDetailLevel(0.85)).toBe('full');
    expect(nodeDetailLevel(1.5)).toBe('full');
  });
});
