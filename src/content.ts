// Builds the in-memory doc index + navigation tree for the portal.
//
// Two kinds of pages are supported and merged here:
//   1. JSX pages  -> portal/src/pages/<group>/<file>.tsx  (rich, hand-built UI)
//   2. Markdown   -> repo's about/ rules/ docs/ MINT/ *.md  (fallback)
//
// When a JSX page exists for a route it WINS; otherwise the Markdown renders.
// This lets us convert pages to JSX one at a time without ever breaking the site.

import type { ComponentType } from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

export interface Doc {
  /** Route group key: 'about' | 'rules' | 'docs' | 'mint'. */
  group: string;
  /** Folder on disk (markdown) or the group (jsx). */
  folder: string;
  /** File name without extension (readme/index => group overview). */
  file: string;
  /** Hash route, e.g. '/about' or '/about/how-data-flows'. */
  route: string;
  /** Page + nav title. */
  title: string;
  /** Sort weight inside its group (lower = higher). */
  order: number;
  /** A rich JSX component, if this page has been converted. */
  Component?: ComponentType;
  /** Raw markdown body, if this page is still markdown. */
  body?: string;
  /** Plain text used for full-text search. */
  text: string;
}

export interface NavItem {
  title: string;
  route: string;
}
export interface NavGroup {
  key: string;
  title: string;
  items: NavItem[];
}

/* ---------- group config ---------- */

const GROUP_FOR_FOLDER: Record<string, string> = {
  about: 'about',
  rules: 'rules',
  docs: 'docs',
  MINT: 'mint',
};

const GROUP_TITLES: Record<string, string> = {
  docs: 'Setup & Reference',
  about: 'Concepts & Layers',
  rules: 'Rules',
  mint: 'MINT (read-only)',
};

const GROUP_ORDER = ['docs', 'about', 'rules', 'mint'];

// Pin a few important pages to the top of their group (only used for markdown
// pages that don't declare their own `order`).
const PINNED: Record<string, string[]> = {
  docs: ['getting-started', 'commands', 'internals', 'testing-postgres'],
  about: ['how-data-flows', 'how-mint-works', 'faq'],
  rules: ['coding-standards', 'how-to-add', 'mint'],
};

function pinnedOrder(group: string, file: string): number {
  const idx = (PINNED[group] ?? []).indexOf(file);
  return idx === -1 ? 500 : 100 + idx;
}

function routeFor(group: string, file: string): string {
  const isOverview = file.toLowerCase() === 'readme' || file.toLowerCase() === 'index';
  return isOverview ? `/${group}` : `/${group}/${file}`;
}

/* ---------- 1. JSX pages ---------- */

export interface PageMeta {
  group: string;
  file: string;
  title: string;
  order?: number;
}
interface PageModule {
  meta: PageMeta;
  default: ComponentType;
}

const PAGE_MODS = import.meta.glob('./pages/*/*.tsx', { eager: true }) as Record<string, PageModule>;

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function jsxDocs(): Doc[] {
  const out: Doc[] = [];
  for (const mod of Object.values(PAGE_MODS)) {
    if (!mod?.meta || !mod.default) continue;
    const { group, file, title, order } = mod.meta;
    let text = '';
    try {
      text = stripHtml(renderToStaticMarkup(createElement(mod.default)));
    } catch {
      text = title;
    }
    out.push({
      group,
      folder: group,
      file,
      route: routeFor(group, file),
      title,
      order: order ?? pinnedOrder(group, file),
      Component: mod.default,
      text,
    });
  }
  return out;
}

/* ---------- 2. Markdown fallback ---------- */

const ABOUT = import.meta.glob('../../about/**/*.md', { query: '?raw', import: 'default', eager: true });
const RULES = import.meta.glob('../../rules/**/*.md', { query: '?raw', import: 'default', eager: true });
const DOCS = import.meta.glob('../../docs/**/*.md', { query: '?raw', import: 'default', eager: true });
const MINT = import.meta.glob('../../MINT/*.md', { query: '?raw', import: 'default', eager: true });

function titleOf(markdown: string, fallback: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  if (!match) return fallback;
  return match[1].replace(/`/g, '').trim();
}

function markdownDocs(): Doc[] {
  const out: Doc[] = [];
  const sources: Array<[string, Record<string, unknown>]> = [
    ['about', ABOUT],
    ['rules', RULES],
    ['docs', DOCS],
    ['MINT', MINT],
  ];
  for (const [folder, mods] of sources) {
    const group = GROUP_FOR_FOLDER[folder];
    for (const [path, raw] of Object.entries(mods)) {
      const body = String(raw);
      const fileName = path.split('/').pop() ?? '';
      const file = fileName.replace(/\.md$/i, '');
      if (file.startsWith('.')) continue;
      const isOverview = file.toLowerCase() === 'readme';
      const fallback = isOverview ? GROUP_TITLES[group] : file;
      out.push({
        group,
        folder,
        file,
        route: routeFor(group, file),
        title: titleOf(body, fallback),
        order: pinnedOrder(group, file),
        body,
        text: body,
      });
    }
  }
  return out;
}

/* ---------- merge (JSX wins) ---------- */

// MINT is internal/proprietary. Its docs are visible in local dev but excluded
// from production builds so a public deploy (e.g. Vercel) never ships them.
// Set VITE_INCLUDE_MINT=true at build time to force-include them.
const INCLUDE_MINT =
  import.meta.env.DEV || import.meta.env.VITE_INCLUDE_MINT === 'true';

function buildIndex(): Doc[] {
  const byRoute = new Map<string, Doc>();
  for (const d of markdownDocs()) byRoute.set(d.route, d);
  for (const d of jsxDocs()) byRoute.set(d.route, d); // JSX overrides markdown
  let docs = [...byRoute.values()];
  if (!INCLUDE_MINT) docs = docs.filter((d) => d.group !== 'mint');
  return docs;
}

export const DOCS_INDEX: Doc[] = buildIndex();
export const DOC_BY_ROUTE: Map<string, Doc> = new Map(DOCS_INDEX.map((d) => [d.route, d]));

/** How many pages are now rich JSX (shown in the footer). */
export const JSX_COUNT = DOCS_INDEX.filter((d) => d.Component).length;

export function buildNav(): NavGroup[] {
  const groups: NavGroup[] = [];
  for (const groupKey of GROUP_ORDER) {
    const docs = DOCS_INDEX.filter((d) => d.group === groupKey);
    if (docs.length === 0) continue;

    const overview = docs.find((d) => d.route === `/${groupKey}`);
    const rest = docs.filter((d) => d.route !== `/${groupKey}`);
    rest.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

    const items: NavItem[] = [];
    if (overview) items.push({ title: 'Overview', route: overview.route });
    for (const d of rest) items.push({ title: d.title, route: d.route });

    groups.push({ key: groupKey, title: GROUP_TITLES[groupKey], items });
  }
  return groups;
}

export const NAV: NavGroup[] = buildNav();

const DOC_BY_KEY: Map<string, Doc> = new Map(
  DOCS_INDEX.map((d) => [`${d.folder}/${d.file}`.toLowerCase(), d]),
);

/** Resolve a markdown link relative to its folder into an in-app hash route. */
export function resolveDocLink(currentFolder: string, href: string): string | null {
  if (!href) return null;
  if (/^(https?:|mailto:|#)/i.test(href)) return null;
  const [pathPart, anchor] = href.split('#');
  if (!pathPart) return anchor ? `#${anchor}` : null;
  const baseSegments = [currentFolder];
  for (const seg of pathPart.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') baseSegments.pop();
    else baseSegments.push(seg);
  }
  const resolved = baseSegments.join('/').replace(/\.md$/i, '');
  const doc = DOC_BY_KEY.get(resolved.toLowerCase());
  if (!doc) return null;
  return `#${doc.route}${anchor ? `#${anchor}` : ''}`;
}
