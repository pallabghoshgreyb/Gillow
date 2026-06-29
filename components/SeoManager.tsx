import React, { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  buildBreadcrumbSchema,
  buildOrganizationSchema,
  buildWebApplicationSchema,
  buildWebSiteSchema,
  getSeoMeta,
} from '../utils/seo';
import {
  endSession,
  initializeAnalyticsScripts,
  startSession,
  trackEvent,
  trackOutboundLink,
  trackPageView,
  trackScrollDepth,
} from '../utils/analytics';
import { DEFAULT_THEME_COLOR, OG_IMAGE_URL, SEARCH_CONSOLE_VERIFICATION, SITE_NAME } from '../utils/siteConfig';

const upsertMeta = (selector: string, attrName: 'name' | 'property', attrValue: string, content: string) => {
  let meta = document.head.querySelector<HTMLMetaElement>(`${selector}`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attrName, attrValue);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
  return meta;
};

const upsertLink = (rel: string, href: string) => {
  let link = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
  return link;
};

const upsertScriptJsonLd = (id: string, value: unknown) => {
  let script = document.head.querySelector<HTMLScriptElement>(`script[data-seo-id="${id}"]`);
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.seoId = id;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(value);
};

const SeoManager: React.FC = () => {
  const location = useLocation();
  const meta = useMemo(() => getSeoMeta({ pathname: location.pathname, search: location.search }), [location.pathname, location.search]);

  useEffect(() => {
    document.title = meta.title;
    upsertMeta('meta[name="description"]', 'name', 'description', meta.description);
    upsertMeta('meta[name="robots"]', 'name', 'robots', meta.robots);
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', meta.title);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', meta.description);
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', meta.ogType);
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', OG_IMAGE_URL);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', meta.canonical);
    upsertMeta('meta[property="og:site_name"]', 'property', 'og:site_name', SITE_NAME);
    upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', meta.title);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', meta.description);
    upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', OG_IMAGE_URL);
    upsertMeta('meta[name="theme-color"]', 'name', 'theme-color', DEFAULT_THEME_COLOR);
    upsertMeta('meta[name="application-name"]', 'name', 'application-name', SITE_NAME);
    upsertLink('canonical', meta.canonical);
    upsertLink('icon', '/logo.gif');
    upsertLink('apple-touch-icon', '/apple-touch-icon.svg');
    upsertLink('manifest', '/manifest.webmanifest');

    if (SEARCH_CONSOLE_VERIFICATION) {
      upsertMeta(
        'meta[name="google-site-verification"]',
        'name',
        'google-site-verification',
        SEARCH_CONSOLE_VERIFICATION,
      );
    }

    upsertScriptJsonLd('organization', buildOrganizationSchema());
    upsertScriptJsonLd('website', buildWebSiteSchema(meta));
    upsertScriptJsonLd('webapplication', buildWebApplicationSchema(meta));
    upsertScriptJsonLd('breadcrumbs', buildBreadcrumbSchema(meta.breadcrumbs));
  }, [meta]);

  useEffect(() => {
    initializeAnalyticsScripts();
    startSession();
  }, []);

  useEffect(() => {
    trackPageView(meta.title, `${location.pathname}${location.search}`);
    if (location.pathname === '/') {
      trackEvent('Homepage Loaded', { path: location.pathname });
    }
    if (location.pathname === '/landscape-preview') {
      trackEvent('Landscape Preview Viewed', { path: location.pathname });
    }
    if (location.pathname === '/404') {
      trackEvent('404 Hit', { path: location.pathname });
    }
  }, [location.pathname, location.search, meta.title]);

  useEffect(() => {
    let activeThreshold = 0;

    const handleScroll = () => {
      const scrollableHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const depth = Math.min(100, Math.round((window.scrollY / scrollableHeight) * 100));

      if (depth >= 25 && activeThreshold < 25) {
        activeThreshold = 25;
        trackScrollDepth(25, location.pathname);
      }
      if (depth >= 50 && activeThreshold < 50) {
        activeThreshold = 50;
        trackScrollDepth(50, location.pathname);
      }
      if (depth >= 75 && activeThreshold < 75) {
        activeThreshold = 75;
        trackScrollDepth(75, location.pathname);
      }
      if (depth >= 100 && activeThreshold < 100) {
        activeThreshold = 100;
        trackScrollDepth(100, location.pathname);
      }
    };

    const handleError = (event: ErrorEvent) => {
      trackEvent('App Error', {
        message: event.message || 'Unknown error',
        source: event.filename || 'unknown',
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = typeof event.reason === 'string' ? event.reason : event.reason?.message || 'Unhandled promise rejection';
      trackEvent('App Error', {
        message: reason,
      });
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        endSession();
      }
    };

    const handleBeforeUnload = () => {
      endSession();
    };

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href) return;

      const isExternal = /^https?:\/\//i.test(href) && !href.startsWith(window.location.origin);
      if (anchor.hasAttribute('download')) {
        trackOutboundLink(href, anchor.textContent?.trim() || 'download');
      } else if (isExternal) {
        trackOutboundLink(href, anchor.textContent?.trim() || href);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleDocumentClick, true);

    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, [location.pathname]);

  useEffect(() => {
    const handleConsentChange = () => {
      initializeAnalyticsScripts();
    };

    window.addEventListener('patindex-consent-change', handleConsentChange);
    return () => window.removeEventListener('patindex-consent-change', handleConsentChange);
  }, []);

  return null;
};

export default SeoManager;
