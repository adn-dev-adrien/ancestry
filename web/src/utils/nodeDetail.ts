export type NodeDetailLevel = 'compact' | 'medium' | 'full';

// Below MEDIUM_ZOOM the card shows only the name; below FULL_ZOOM it adds the photo;
// at/above FULL_ZOOM it shows every field. Thresholds keep on-screen text legible
// (rendered size ≈ fontSize × zoom).
export const MEDIUM_ZOOM = 0.55;
export const FULL_ZOOM = 0.85;

export function nodeDetailLevel(zoom: number): NodeDetailLevel {
  if (zoom < MEDIUM_ZOOM) return 'compact';
  if (zoom < FULL_ZOOM) return 'medium';
  return 'full';
}
