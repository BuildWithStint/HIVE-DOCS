import { useEffect, useId, useState } from 'react';
import mermaid from 'mermaid';

function currentTheme(): string {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme ?? 'dark';
}

function configure(theme: string) {
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: theme === 'light' ? 'neutral' : 'dark',
    themeVariables: {
      fontFamily: "'Inter', -apple-system, sans-serif",
      primaryColor: theme === 'light' ? '#fff7e0' : '#1d2330',
      primaryBorderColor: '#ffc83d',
      primaryTextColor: theme === 'light' ? '#1b2230' : '#e6eaf2',
      lineColor: theme === 'light' ? '#8a94a6' : '#6b7689',
      secondaryColor: theme === 'light' ? '#eef2f9' : '#161c28',
      tertiaryColor: theme === 'light' ? '#f6f8fc' : '#11161f',
    },
  });
}

/**
 * Renders a Mermaid diagram from its text markup. Re-renders when the theme
 * changes. During server-side text extraction (search index) it renders the
 * raw markup as text, which is harmless.
 */
export function Mermaid({ chart, caption }: { chart: string; caption?: string }) {
  const id = 'm' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [theme, setTheme] = useState<string>(currentTheme);

  // Follow the global theme toggle.
  useEffect(() => {
    const root = document.documentElement;
    const obs = new MutationObserver(() => setTheme(root.dataset.theme ?? 'dark'));
    obs.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    configure(theme);
    void mermaid
      .render(id, chart.trim())
      .then(({ svg }) => !cancelled && setSvg(svg))
      .catch((e: unknown) => !cancelled && setError(String(e)));
    return () => {
      cancelled = true;
    };
  }, [chart, theme, id]);

  return (
    <figure className="diagram">
      <div className="diagram-box">
        {error ? (
          <pre className="diagram-error">{error}</pre>
        ) : svg ? (
          <div dangerouslySetInnerHTML={{ __html: svg }} />
        ) : (
          <pre className="diagram-raw">{chart.trim()}</pre>
        )}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
