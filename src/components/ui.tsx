import type { ReactNode } from 'react';
import { useState } from 'react';
import hljs from 'highlight.js';

/** Turn a heading title into a stable slug id used for the "on this page" panel. */
export function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/* ------------------------------------------------------------------ *
 * Page shell + headings
 * ------------------------------------------------------------------ */

export function Page({ children }: { children: ReactNode }) {
  return <div className="doc">{children}</div>;
}

/** Big page title + one-line summary at the top of a page. */
export function PageHeader({
  kicker,
  title,
  lead,
}: {
  kicker?: string;
  title: string;
  lead?: ReactNode;
}) {
  return (
    <header className="doc-head">
      {kicker && <div className="doc-kicker">{kicker}</div>}
      <h1>{title}</h1>
      {lead && <p className="doc-lead">{lead}</p>}
    </header>
  );
}

/** An H2 section with an auto-generated id (feeds the table of contents). */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="doc-section">
      <h2 id={slug(title)}>{title}</h2>
      {children}
    </section>
  );
}

/** An H3 sub-heading with an auto-generated id. */
export function Sub({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <>
      <h3 id={slug(title)}>{title}</h3>
      {children}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Inline + block text helpers
 * ------------------------------------------------------------------ */

/** Inline code, e.g. <C>orgId</C>. */
export function C({ children }: { children: ReactNode }) {
  return <code className="inline-code">{children}</code>;
}

/** A short definition line: term + explanation. */
export function Term({ word, children }: { word: ReactNode; children: ReactNode }) {
  return (
    <p className="term">
      <span className="term-word">{word}</span>
      <span className="term-def">{children}</span>
    </p>
  );
}

/* ------------------------------------------------------------------ *
 * Callouts
 * ------------------------------------------------------------------ */

type CalloutKind = 'note' | 'tip' | 'warn' | 'danger' | 'key';
const CALLOUT_ICON: Record<CalloutKind, string> = {
  note: 'ℹ️',
  tip: '💡',
  warn: '⚠️',
  danger: '🛑',
  key: '🔑',
};
const CALLOUT_LABEL: Record<CalloutKind, string> = {
  note: 'Note',
  tip: 'Tip',
  warn: 'Careful',
  danger: 'Never do this',
  key: 'Key idea',
};

export function Callout({
  kind = 'note',
  title,
  children,
}: {
  kind?: CalloutKind;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className={`callout callout-${kind}`}>
      <div className="callout-head">
        <span className="callout-icon">{CALLOUT_ICON[kind]}</span>
        <span className="callout-label">{title ?? CALLOUT_LABEL[kind]}</span>
      </div>
      <div className="callout-body">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Code block (syntax highlighted, copy button, language label)
 * ------------------------------------------------------------------ */

export function CodeBlock({
  code,
  lang = 'text',
  title,
}: {
  code: string;
  lang?: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);
  const trimmed = code.replace(/^\n+|\n+$/g, '');

  let html = '';
  try {
    html =
      lang && hljs.getLanguage(lang)
        ? hljs.highlight(trimmed, { language: lang }).value
        : hljs.highlightAuto(trimmed).value;
  } catch {
    html = trimmed;
  }

  const onCopy = () => {
    void navigator.clipboard.writeText(trimmed).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };

  return (
    <div className="codewrap">
      <div className="code-bar">
        {title && <span className="code-title">{title}</span>}
        <span className="code-lang">{lang}</span>
        <button className="copy-btn" type="button" onClick={onCopy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre>
        <code className={`hljs language-${lang}`} dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Steps
 * ------------------------------------------------------------------ */

export function Steps({ children }: { children: ReactNode }) {
  return <ol className="steps">{children}</ol>;
}

export function Step({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <li className="step">
      {title && <div className="step-title">{title}</div>}
      <div className="step-body">{children}</div>
    </li>
  );
}

/* ------------------------------------------------------------------ *
 * Cards
 * ------------------------------------------------------------------ */

export function Cards({ children, cols = 2 }: { children: ReactNode; cols?: number }) {
  return (
    <div className="cards" style={{ '--cols': cols } as React.CSSProperties}>
      {children}
    </div>
  );
}

export function Card({
  icon,
  title,
  to,
  children,
}: {
  icon?: string;
  title: string;
  to?: string;
  children?: ReactNode;
}) {
  const inner = (
    <>
      {icon && <div className="card-icon">{icon}</div>}
      <div className="card-title">{title}</div>
      {children && <div className="card-body">{children}</div>}
    </>
  );
  if (to) {
    return (
      <a className="card card-link" href={to.startsWith('#') ? to : `#/${to}`}>
        {inner}
      </a>
    );
  }
  return <div className="card">{inner}</div>;
}

/* ------------------------------------------------------------------ *
 * File tree
 * ------------------------------------------------------------------ */

export interface TreeNode {
  name: string;
  note?: string;
  children?: TreeNode[];
}

function TreeRows({ nodes, depth }: { nodes: TreeNode[]; depth: number }) {
  return (
    <>
      {nodes.map((n, i) => (
        <div key={`${depth}-${i}-${n.name}`}>
          <div className="tree-row" style={{ paddingLeft: depth * 18 }}>
            <span className="tree-name">
              {n.children ? '📁' : '📄'} {n.name}
            </span>
            {n.note && <span className="tree-note">{n.note}</span>}
          </div>
          {n.children && <TreeRows nodes={n.children} depth={depth + 1} />}
        </div>
      ))}
    </>
  );
}

export function FileTree({ nodes, title }: { nodes: TreeNode[]; title?: string }) {
  return (
    <div className="filetree">
      {title && <div className="filetree-title">{title}</div>}
      <TreeRows nodes={nodes} depth={0} />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Table
 * ------------------------------------------------------------------ */

export function Table({
  head,
  rows,
}: {
  head: ReactNode[];
  rows: ReactNode[][];
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((cell, ci) => (
                <td key={ci}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Links between docs
 * ------------------------------------------------------------------ */

/** In-app link to another doc, e.g. <DocLink to="about/how-mint-works">. */
export function DocLink({ to, children }: { to: string; children: ReactNode }) {
  const href = to.startsWith('#') ? to : `#/${to.replace(/^\/+/, '')}`;
  return <a href={href}>{children}</a>;
}

/** "Where to next" footer with linked cards. */
export function NextSteps({ children }: { children: ReactNode }) {
  return (
    <section className="doc-section next-steps">
      <h2 id="where-to-next">Where to next</h2>
      <Cards cols={2}>{children}</Cards>
    </section>
  );
}

/** Small honey-coloured pill / tag. */
export function Pill({ children }: { children: ReactNode }) {
  return <span className="pill">{children}</span>;
}
