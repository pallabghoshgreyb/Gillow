import { CLARITY_ID, GA4_ID, GTM_ID, SITE_URL } from './siteConfig';

export type AnalyticsConsent = 'essential' | 'analytics' | 'marketing';

export type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

const CONSENT_KEY = 'patindex_cookie_consent';
const SESSION_START_KEY = 'patindex_session_start';
const INJECTED_SCRIPT_IDS = {
  ga4: 'patindex-ga4',
  gtm: 'patindex-gtm',
  clarity: 'patindex-clarity',
};

const hasWindow = () => typeof window !== 'undefined' && typeof document !== 'undefined';

export const getAnalyticsConsent = (): AnalyticsConsent | null => {
  if (!hasWindow()) return null;
  const stored = window.localStorage.getItem(CONSENT_KEY);
  if (stored === 'essential' || stored === 'analytics' || stored === 'marketing') {
    return stored;
  }
  return null;
};

export const setAnalyticsConsent = (consent: AnalyticsConsent) => {
  if (!hasWindow()) return;
  window.localStorage.setItem(CONSENT_KEY, consent);
  window.dispatchEvent(new Event('patindex-consent-change'));
};

export const clearAnalyticsConsent = () => {
  if (!hasWindow()) return;
  window.localStorage.removeItem(CONSENT_KEY);
  window.dispatchEvent(new Event('patindex-consent-change'));
};

export const hasAnalyticsConsent = () => {
  const consent = getAnalyticsConsent();
  return consent === 'analytics' || consent === 'marketing';
};

const ensureDataLayer = () => {
  if (!hasWindow()) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtagShim(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
};

const injectScriptOnce = (id: string, src: string, parent: HTMLElement = document.head) => {
  if (!hasWindow()) return;
  if (document.getElementById(id)) return;

  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  script.src = src;
  parent.appendChild(script);
};

export const initializeAnalyticsScripts = () => {
  if (!hasWindow() || !hasAnalyticsConsent() || window.__PATINDEX_ANALYTICS_LOADED__) {
    return;
  }

  if (GA4_ID) {
    injectScriptOnce(
      INJECTED_SCRIPT_IDS.ga4,
      `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_ID)}`,
    );
    ensureDataLayer();
    window.gtag?.('js', new Date());
    window.gtag?.('config', GA4_ID, {
      send_page_view: false,
      transport_type: 'beacon',
    });
  }

  if (GTM_ID) {
    ensureDataLayer();
    window.dataLayer?.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    injectScriptOnce(
      INJECTED_SCRIPT_IDS.gtm,
      `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`,
    );
  }

  if (CLARITY_ID) {
    injectScriptOnce(
      INJECTED_SCRIPT_IDS.clarity,
      `https://www.clarity.ms/tag/${encodeURIComponent(CLARITY_ID)}`,
    );
  }

  window.__PATINDEX_ANALYTICS_LOADED__ = true;
};

export const trackEvent = (eventName: string, params: AnalyticsParams = {}) => {
  if (!hasWindow() || !hasAnalyticsConsent()) return;

  ensureDataLayer();
  window.gtag?.('event', eventName, params);
};

export const trackPageView = (title: string, path: string) => {
  if (!hasWindow() || !hasAnalyticsConsent()) return;

  const pageLocation = `${SITE_URL}${path}`;
  ensureDataLayer();
  window.gtag?.('event', 'page_view', {
    page_title: title,
    page_location: pageLocation,
    page_path: path,
  });
};

export const startSession = () => {
  if (!hasWindow()) return;
  if (!window.sessionStorage.getItem(SESSION_START_KEY)) {
    window.sessionStorage.setItem(SESSION_START_KEY, String(Date.now()));
    trackEvent('Session Started', {
      site_url: SITE_URL,
    });
  }
};

export const endSession = () => {
  if (!hasWindow()) return;
  const startedAt = Number(window.sessionStorage.getItem(SESSION_START_KEY) || 0);
  const durationMs = startedAt > 0 ? Math.max(0, Date.now() - startedAt) : 0;
  trackEvent('Session Ended', {
    duration_ms: durationMs,
  });
};

export const trackScrollDepth = (depth: number, path: string) => {
  trackEvent('Scroll Depth', {
    depth,
    page_path: path,
  });
};

export const trackOutboundLink = (url: string, label?: string) => {
  trackEvent('Outbound Link Clicked', {
    url,
    label: label || '',
  });
};

export const trackDownload = (url: string, label?: string) => {
  trackEvent('Download Clicked', {
    url,
    label: label || '',
  });
};
