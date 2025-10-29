#!/usr/bin/env node
// Lightweight web-scraper to collect biodegradable innovation entries
// Usage:
//   node scripts/scrape_innovations.mjs --out data/innovations.scraped.json --limit 100
// Then manually curate and merge into data/innovations.js

import fs from 'node:fs/promises';
import path from 'node:path';

const SOURCES = [
  // Replace or add to these with your preferred sources
  { name: 'Example List A', url: 'https://example.com/biodegradable-innovations-a' },
  { name: 'Example List B', url: 'https://example.com/biodegradable-innovations-b' },
];

const parseArgs = () => {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf('--out');
  const limitIdx = args.indexOf('--limit');
  const out = outIdx !== -1 ? args[outIdx + 1] : 'data/innovations.scraped.json';
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 100;
  return { out, limit };
};

const normalizeItem = (raw) => {
  // Map generic scraped keys into our schema with best-effort fallback
  return {
    id: raw.id || raw.slug || (raw.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48) || undefined,
    title: raw.title || raw.name || '',
    inventor: raw.inventor || raw.creator || raw.author || '',
    affiliation: raw.affiliation || raw.org || raw.company || '',
    year: String(raw.year || raw.date || '').replace(/^(.*?(\d{4})).*$/, '$2') || '',
    category: raw.category || raw.type || '',
    location: raw.location || raw.country || '',
    description: raw.description || raw.summary || '',
    materials: Array.isArray(raw.materials) ? raw.materials : (raw.materials ? String(raw.materials).split(/,\s*/) : []),
    impact: raw.impact || raw.benefits || '',
    notes: raw.notes || '',
    links: raw.links || (raw.url ? [{ label: 'Source', url: raw.url }] : []),
  };
};

const dedupe = (items) => {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = (item.title || '').toLowerCase() + '|' + (item.inventor || '').toLowerCase();
    if (!seen.has(key) && item.title) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
};

const scrapeSource = async (source) => {
  // NOTE: This is a placeholder; replace with real fetch/parse logic for your sources
  // Using minimal structure to avoid tight coupling to any one site.
  try {
    const res = await fetch(source.url, { headers: { 'User-Agent': 'ReleafScraper/1.0' } });
    const html = await res.text();
    // Very naive extraction; you should replace with specific selectors for your sources
    const maybeTitles = Array.from(html.matchAll(/<h[12][^>]*>(.*?)<\/h[12]>/gi)).map(m => m[1].replace(/<[^>]*>/g, '').trim()).filter(Boolean);
    const base = maybeTitles.slice(0, 20).map((title, idx) => ({
      title,
      url: source.url + '#item-' + idx,
      description: '',
      inventor: '',
      affiliation: source.name,
      materials: [],
      category: '',
      year: '',
      impact: '',
      notes: '',
      location: '',
    }));
    return base.map(normalizeItem);
  } catch (e) {
    console.error('Failed to scrape', source.url, e.message);
    return [];
  }
};

const main = async () => {
  const { out, limit } = parseArgs();
  const results = [];
  for (const src of SOURCES) {
    const subset = await scrapeSource(src);
    results.push(...subset);
    if (results.length >= limit) break;
  }
  const cleaned = dedupe(results).slice(0, limit);
  const outPath = path.resolve(process.cwd(), out);
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(cleaned, null, 2), 'utf8');
  console.log(`Wrote ${cleaned.length} items to ${outPath}`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


