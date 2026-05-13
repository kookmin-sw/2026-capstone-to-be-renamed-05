export const COMPANY_LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const COMPANY_BACKGROUND_MAX_BYTES = 5 * 1024 * 1024;
export const PROFILE_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

export const COMPANY_LOGO_ALLOWED_CONTENT_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
] as const;

export const COMPANY_BACKGROUND_ALLOWED_CONTENT_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

export const PROFILE_IMAGE_ALLOWED_CONTENT_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

export const COMPANY_LOGO_EXTENSIONS = new Map<string, string>([
  ['image/png', 'png'],
  ['image/jpeg', 'jpg'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
]);

export const COMPANY_BACKGROUND_EXTENSIONS = new Map<string, string>([
  ['image/png', 'png'],
  ['image/jpeg', 'jpg'],
  ['image/webp', 'webp'],
]);

export const PROFILE_IMAGE_EXTENSIONS = new Map<string, string>([
  ['image/png', 'png'],
  ['image/jpeg', 'jpg'],
  ['image/webp', 'webp'],
]);
