
export const ROLES = {
  ADMIN: 'ADMIN',
  FARMER: 'FARMER',
} as const;

export const CROP_TYPES = [
  'rice',
  'wheat',
  'maize',
  'potato',
  'tomato',
  'onion',
  'garlic',
  'chili',
  'brinjal',
  'cabbage',
  'cauliflower',
  'okra',
  'spinach',
  'carrot',
  'radish',
  'cucumber',
  'bottle_gourd',
  'bitter_gourd',
  'pumpkin',
  'watermelon',
  'mango',
  'banana',
  'papaya',
  'lemon',
  'coconut',
  'sugarcane',
  'jute',
  'cotton',
  'tea',
  'other'
] as const;

export const SOIL_TYPES = [
  'clay',
  'sandy',
  'loamy',
  'silt',
  'peat',
  'chalk'
] as const;

export const IRRIGATION_TYPES = [
  'drip',
  'sprinkler',
  'flood',
  'manual',
  'rainfed'
] as const;