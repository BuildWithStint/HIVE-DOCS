import { useEffect, useMemo, useState } from 'react';
import { DOCS_INDEX } from '../content';

interface Props {
  onNavigate: (route: string) => void;
}

interface Hit {
  route: string;
  title: string;
  group: string;
  snippet: string;
}

/** Lightweight client-side search over every doc's title + body. */
export function Search({ onNavigate }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const hits = useMemo<Hit[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const results: Hit[] = [];
    for (const doc of DOCS_INDEX) {
      const inTitle = doc.title.toLowerCase().includes(q);
      const idx = doc.text.toLowerCase().indexOf(q);
      if (!inTitle && idx === -1) continue;
      let snippet = '';
      if (idx !== -1) {
        const start = Math.max(0, idx - 35);
        snippet = doc.text.slice(start, idx + 45).replace(/[#`*\n]/g, ' ').trim();
      }
      results.push({ route: doc.route, title: doc.title, group: doc.group, snippet });
      if (results.length >= 12) break;
    }
    return results;
  }, [query]);

  useEffect(() => setActiveIndex(0), [query]);

  // Cmd/Ctrl+K focuses the search box.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.getElementById('hive-search')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = (route: string) => {
    setQuery('');
    setOpen(false);
    onNavigate(route);
  };

  return (
    <div className="search">
      <input
        id="hive-search"
        className="search-input"
        placeholder="Search docs…  (⌘K)"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') setActiveIndex((i) => Math.min(i + 1, hits.length - 1));
          if (e.key === 'ArrowUp') setActiveIndex((i) => Math.max(i - 1, 0));
          if (e.key === 'Enter' && hits[activeIndex]) go(hits[activeIndex].route);
          if (e.key === 'Escape') setOpen(false);
        }}
      />
      {open && hits.length > 0 && (
        <ul className="search-results">
          {hits.map((h, i) => (
            <li
              key={h.route}
              className={i === activeIndex ? 'active' : ''}
              onMouseDown={() => go(h.route)}
            >
              <span className="hit-title">{h.title}</span>
              <span className="hit-group">{h.group}</span>
              {h.snippet && <span className="hit-snippet">…{h.snippet}…</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
