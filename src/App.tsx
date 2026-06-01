import { useEffect, useState } from 'react';
import { NAV, DOC_BY_ROUTE, DOCS_INDEX, JSX_COUNT } from './content';
import { MarkdownView, useActiveHeading } from './components/MarkdownView';
import { Search } from './components/Search';
import { HiveMark } from './components/Logos';

const DEFAULT_ROUTE = '/docs/getting-started';

interface TocEntry {
  id: string;
  text: string;
  level: number;
}

/** Read the current route from the URL hash, e.g. '#/about/faq' -> '/about/faq'. */
function useHashRoute(): [string, string | null, (route: string) => void] {
  const parse = (): [string, string | null] => {
    const raw = window.location.hash.replace(/^#/, '') || DEFAULT_ROUTE;
    const [path, anchor] = raw.split('#');
    return [path || DEFAULT_ROUTE, anchor ?? null];
  };
  const [state, setState] = useState<[string, string | null]>(parse);

  useEffect(() => {
    const onHash = () => setState(parse());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (r: string) => {
    window.location.hash = r;
  };
  return [state[0], state[1], navigate];
}

function useTheme(): [string, () => void] {
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('hive-theme') ?? 'dark');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('hive-theme', theme);
  }, [theme]);
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))];
}

/** Build the "on this page" list by scanning the rendered headings (works for
 *  both JSX pages and markdown). */
function useDomToc(route: string): TocEntry[] {
  const [toc, setToc] = useState<TocEntry[]>([]);
  useEffect(() => {
    const scan = () => {
      const nodes = document.querySelectorAll<HTMLElement>('.content h2[id], .content h3[id]');
      const entries: TocEntry[] = [];
      nodes.forEach((el) =>
        entries.push({
          id: el.id,
          text: (el.textContent ?? '').trim(),
          level: el.tagName === 'H2' ? 2 : 3,
        }),
      );
      setToc(entries);
    };
    const raf = requestAnimationFrame(() => requestAnimationFrame(scan));
    return () => cancelAnimationFrame(raf);
  }, [route]);
  return toc;
}

export default function App() {
  const [route, anchor, navigate] = useHashRoute();
  const [theme, toggleTheme] = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  // Resolve a bare group route (e.g. '/mint') with no overview page to that
  // group's first page, so section roots always land somewhere.
  const groupFallback = NAV.find((g) => `/${g.key}` === route)?.items[0]?.route;
  useEffect(() => {
    if (!DOC_BY_ROUTE.has(route) && groupFallback) {
      navigate(groupFallback);
    }
  }, [route, groupFallback, navigate]);

  const doc = DOC_BY_ROUTE.get(route);
  const toc = useDomToc(route);
  const activeId = useActiveHeading(toc.map((t) => t.id));

  // Scroll to top (or to anchor) on route change.
  useEffect(() => {
    if (anchor) {
      requestAnimationFrame(() =>
        document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' }),
      );
    } else {
      document.querySelector('.content')?.scrollTo({ top: 0 });
    }
    setMenuOpen(false);
  }, [route, anchor]);

  const Doc = doc?.Component;

  return (
    <div className="layout">
      <header className="topbar">
        <button className="menu-btn" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
          ☰
        </button>
        <a className="brand" href={`#${DEFAULT_ROUTE}`}>
          <span className="brand-mark"><HiveMark size={26} /></span>
          <span className="brand-name">HIVE</span>
          <span className="brand-sub">docs</span>
        </a>
        <Search onNavigate={navigate} />
        <button className="theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </header>

      <div className="body">
        <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
          <nav>
            {NAV.map((group) => (
              <div className="nav-group" key={group.key}>
                <div className="nav-group-title">{group.title}</div>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.route}>
                      <a
                        href={`#${item.route}`}
                        className={route === item.route ? 'active' : ''}
                      >
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          <div className="sidebar-foot">
            {DOCS_INDEX.length} pages · {JSX_COUNT} rich
          </div>
        </aside>

        <main className="content">
          {Doc ? (
            <Doc />
          ) : doc ? (
            <article className="markdown">
              <MarkdownView folder={doc.folder} body={doc.body ?? ''} />
            </article>
          ) : (
            <article className="markdown">
              <h1>Page not found</h1>
              <p>
                No doc at <code>{route}</code>.{' '}
                <a href={`#${DEFAULT_ROUTE}`}>Go to Getting started →</a>
              </p>
            </article>
          )}
        </main>

        {toc.length > 1 && (
          <aside className="toc">
            <div className="toc-title">On this page</div>
            <ul>
              {toc.map((t) => (
                <li key={t.id} className={`lvl-${t.level} ${activeId === t.id ? 'active' : ''}`}>
                  <a href={`#${route}#${t.id}`}>{t.text}</a>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
