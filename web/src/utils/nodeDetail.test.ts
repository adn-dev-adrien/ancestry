import { describe, expect, it } from 'vitest';
import { nameFontSize, nodeDetailLevel } from './nodeDetail';

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

describe('nameFontSize', () => {
  it('keeps the base size at zoom >= 1', () => {
    expect(nameFontSize(1)).toBe(14);
    expect(nameFontSize(2)).toBe(14);
  });

  it('grows as the zoom decreases', () => {
    expect(nameFontSize(0.5)).toBe(28);
    expect(nameFontSize(0.7)).toBe(20);
  });

  it('is capped for tiny zooms', () => {
    expect(nameFontSize(0.1)).toBe(40);
  });
});
