import type { HTMLAttributes, MouseEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { resolveDocLink } from '../content';

interface Props {
  /** Folder of the doc being rendered (for resolving relative links). */
  folder: string;
  /** Raw markdown body. */
  body: string;
}

/** Copy-to-clipboard button shown on hover over a code block. */
function CodeBlock({ children, ...props }: HTMLAttributes<HTMLPreElement>) {
  const [copied, setCopied] = useState(false);

  const onCopy = (e: MouseEvent<HTMLButtonElement>) => {
    const pre = e.currentTarget.parentElement?.querySelector('code');
    const text = pre?.textContent ?? '';
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };

  return (
    <div className="codewrap">
      <button className="copy-btn" onClick={onCopy} type="button">
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre {...props}>{children}</pre>
    </div>
  );
}

export function MarkdownView({ folder, body }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: 'wrap' }],
        rehypeHighlight,
      ]}
      components={{
        pre: CodeBlock as never,
        a({ href, children, ...rest }) {
          const resolved = href ? resolveDocLink(folder, href) : null;
          if (resolved) {
            return (
              <a href={resolved} {...rest}>
                {children}
              </a>
            );
          }
          const external = href && /^https?:/i.test(href);
          return (
            <a
              href={href}
              {...rest}
              {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
            >
              {children}
            </a>
          );
        },
      }}
    >
      {body}
    </ReactMarkdown>
  );
}

export interface TocEntry {
  id: string;
  text: string;
  level: number;
}

/** Extract H2/H3 headings from markdown for the "On this page" panel. */
export function useToc(body: string): TocEntry[] {
  return useMemo(() => {
    const entries: TocEntry[] = [];
    const lines = body.split('\n');
    let inFence = false;
    for (const line of lines) {
      if (line.trim().startsWith('```')) {
        inFence = !inFence;
        continue;
      }
      if (inFence) continue;
      const m = line.match(/^(#{2,3})\s+(.+)$/);
      if (!m) continue;
      const level = m[1].length;
      const text = m[2].replace(/`/g, '').replace(/\[(.+?)\]\(.+?\)/g, '$1').trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      entries.push({ id, text, level });
    }
    return entries;
  }, [body]);
}

/** Track which heading is currently in view for TOC highlighting. */
export function useActiveHeading(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (ids.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: '0px 0px -75% 0px' },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [ids]);
  return active;
}
