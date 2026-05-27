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

export const BASE_NAME_PX = 14;
export const MAX_NAME_PX = 40;

/**
 * Name font size (px) counter-scaled to the zoom: when zoomed out the font grows
 * so the on-screen size (fontSize × zoom) stays readable; it never shrinks below
 * the base and is capped so it cannot get absurdly large.
 */
export function nameFontSize(zoom: number): number {
  const z = Math.min(Math.max(zoom, 0.01), 1);
  return Math.min(MAX_NAME_PX, Math.round(BASE_NAME_PX / z));
}
