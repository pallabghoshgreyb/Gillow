import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const patentsFile = path.join(rootDir, 'data', 'patents.ts');

const siteUrl = (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://patindex.com').replace(/\/+$/, '');

const slugify = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const escapeXml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const ensurePublicDir = async () => {
  await fs.mkdir(publicDir, { recursive: true });
};

const buildRoutes = async () => {
  const source = await fs.readFile(patentsFile, 'utf8');
  const domains = new Set();
  const domainSubdomains = new Map();

  for (const match of source.matchAll(/"Domain":"([^"]+)"/g)) {
    domains.add(match[1]);
  }

  for (const domain of domains) {
    domainSubdomains.set(domain, new Set());
  }

  for (const match of source.matchAll(/"Domain":"([^"]+)".*?"Subdomain":"([^"]+)"/g)) {
    const domain = match[1];
    const subdomain = match[2];
    if (!domainSubdomains.has(domain)) {
      domainSubdomains.set(domain, new Set());
    }
    domainSubdomains.get(domain).add(subdomain);
  }

  const publicationNumbers = Array.from(source.matchAll(/"Publication Number":"([^"]+)"/g)).map((match) => match[1]);
  const routes = new Set(['/', '/browse', '/search', '/landscape-preview', '/saved']);

  for (const domain of domains) {
    const domainSlug = slugify(domain);
    routes.add(`/domains/${domainSlug}`);
    routes.add(`/technology/${domainSlug}`);

    for (const subdomain of domainSubdomains.get(domain) || []) {
      routes.add(`/technology/${slugify(`${domain}-${subdomain}`)}`);
    }
  }

  publicationNumbers.forEach((publicationNumber) => {
    routes.add(`/patent/${encodeURIComponent(publicationNumber)}`);
  });

  return Array.from(routes).sort((left, right) => left.localeCompare(right));
};

const writeRobots = async () => {
  const content = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /private
Disallow: /api

Sitemap: ${siteUrl}/sitemap.xml
`;
  await fs.writeFile(path.join(publicDir, 'robots.txt'), content, 'utf8');
};

const writeSitemap = async () => {
  const routes = await buildRoutes();
  const body = routes
    .map((route) => {
      const priority = route === '/' ? '1.0' : route.startsWith('/domains/') || route.startsWith('/technology/') ? '0.8' : route.startsWith('/patent/') ? '0.6' : '0.7';
      return `  <url>
    <loc>${escapeXml(`${siteUrl}${route}`)}</loc>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join('\n');

  const content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

  await fs.writeFile(path.join(publicDir, 'sitemap.xml'), content, 'utf8');
};

await ensurePublicDir();
await Promise.all([writeRobots(), writeSitemap()]);
