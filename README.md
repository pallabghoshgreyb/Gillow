# PatentIndex | Patent & IP Intelligence

PatentIndex is a Zillow-inspired patent intelligence platform for exploring technology domains, analyzing portfolios, and searching patent records with rich filtering and visual discovery.

## Features

- Patent search by number, assignee, title, inventor, and technology.
- Interactive technology landscapes and domain detail pages.
- Portfolio analytics, valuation signals, and comparison views.
- Saved searches, favorites, and patent detail workflows.

## Tech Stack

- React 19
- TypeScript
- Tailwind CSS
- Lucide React
- Recharts
- React Router 7

## Running Locally

1. Install dependencies with `npm install`.
2. Start the app with `npm run dev`.
3. Open the local URL shown by Vite.

## Production SEO, Indexing, and Analytics

### Environment variables

Set these before building for production:

- `VITE_SITE_URL` for the canonical production base URL.
- `VITE_GA4_ID` for Google Analytics 4.
- `VITE_GTM_ID` for Google Tag Manager.
- `VITE_CLARITY_ID` for Microsoft Clarity.
- `VITE_GOOGLE_SITE_VERIFICATION` for Google Search Console verification.

### Metadata updates

- Page titles, meta descriptions, canonical URLs, Open Graph tags, Twitter cards, and JSON-LD are managed in `utils/seo.ts`.
- Route-aware head updates are applied by `components/SeoManager.tsx`.
- Update those helpers when adding a new public route.

### Sitemap and robots

- `scripts/generate-seo-assets.mjs` regenerates `public/robots.txt` and `public/sitemap.xml` before each production build.
- The sitemap is built from the current public route inventory and the patent dataset in `data/patents.ts`.
- Add new public routes to the generator so they are included automatically.

### Structured data

- Organization, WebSite, WebApplication, SearchAction, and BreadcrumbList schemas are emitted as JSON-LD from `utils/seo.ts`.
- Verify new schemas with Google Rich Results or Schema.org validators after adding routes.

### Analytics configuration

- Analytics scripts are consent-gated through `components/CookieConsentBanner.tsx`.
- GA4, GTM, and Clarity only initialize after analytics consent is granted.
- Reusable tracking helpers live in `utils/analytics.ts`.
- Call `trackEvent(...)` from the relevant button or page handler to record custom interactions.

### Search Console verification

- Add your Search Console verification token to `VITE_GOOGLE_SITE_VERIFICATION`.
- HTML file verification can be done by placing the requested HTML file in `public/`.
- DNS verification is handled through your domain registrar or DNS provider.

### Updating robots.txt

- Edit `scripts/generate-seo-assets.mjs` if you need to change public/private route rules.
- Re-run `npm run build` to regenerate the deployed robots file.

### Updating sitemap.xml

- Add new public routes to `scripts/generate-seo-assets.mjs`.
- Re-run `npm run build` so the sitemap is rebuilt from the current source data.

### Social sharing

- Open Graph and Twitter Card previews use `public/og-image.svg` until a dedicated campaign image is introduced.
- Update that asset if you want a different default share preview.

## Future Enhancements

- Real-time API integration.
- AI-powered summaries.
- User authentication.
- Blockchain verification.
