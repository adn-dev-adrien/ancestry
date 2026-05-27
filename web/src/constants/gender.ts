import type { Gender } from '@/services/types';

export const GENDERS: Gender[] = ['MALE', 'FEMALE', 'OTHER'];

/** Node card tint by gender; OTHER and unset persons keep the neutral default. */
export const GENDER_NODE_CLASSES: Record<Gender, string> = {
  MALE: 'border-blue-400 bg-blue-50',
  FEMALE: 'border-pink-400 bg-pink-50',
  OTHER: 'border-border bg-card',
};

export const NEUTRAL_NODE_CLASS = 'border-border bg-card';
