const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const getFallbackSiteUrl = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'http://localhost:3000';
};

const rawSiteUrl = (import.meta.env.VITE_SITE_URL || getFallbackSiteUrl()).trim();

export const SITE_NAME = 'PatentIndex';
export const SITE_URL = trimTrailingSlash(rawSiteUrl || getFallbackSiteUrl());
export const OG_IMAGE_URL = `${SITE_URL}/og-image.svg`;
export const APPLE_TOUCH_ICON_URL = `${SITE_URL}/apple-touch-icon.svg`;
export const DEFAULT_THEME_COLOR = '#00bdcd';

export const GA4_ID = import.meta.env.VITE_GA4_ID?.trim() || '';
export const GTM_ID = import.meta.env.VITE_GTM_ID?.trim() || '';
export const CLARITY_ID = import.meta.env.VITE_CLARITY_ID?.trim() || '';
export const SEARCH_CONSOLE_VERIFICATION = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION?.trim() || '';

export const isProductionSiteUrl = SITE_URL.startsWith('http');
