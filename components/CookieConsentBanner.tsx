import React, { useEffect, useState } from 'react';
import { hasAnalyticsConsent, setAnalyticsConsent, getAnalyticsConsent, type AnalyticsConsent } from '../utils/analytics';

const CookieConsentBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [consent, setConsentState] = useState<AnalyticsConsent | null>(null);

  useEffect(() => {
    const stored = getAnalyticsConsent();
    setConsentState(stored);
    setVisible(!stored);
  }, []);

  const applyConsent = (value: AnalyticsConsent) => {
    setAnalyticsConsent(value);
    setConsentState(value);
    setVisible(false);
  };

  if (!visible || hasAnalyticsConsent() || consent) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[120] mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">Cookies and analytics</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          We use necessary cookies for the app to function and optional analytics cookies to improve search, indexing, and navigation.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => applyConsent('essential')}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Essential only
        </button>
        <button
          type="button"
          onClick={() => applyConsent('analytics')}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Accept analytics
        </button>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
