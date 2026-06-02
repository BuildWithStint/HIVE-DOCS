import {
  Page,
  PageHeader,
  Section,
  Callout,
  CodeBlock,
  FileTree,
  C,
  NextSteps,
  Card,
} from '../../components/ui';
import { Mermaid } from '../../components/Mermaid';

export const meta = {
  group: 'about',
  file: 'devportal',
  title: 'The docs portal',
  order: 9,
};

export default function Devportal() {
  return (
    <Page>
      <PageHeader
        kicker="Concepts & Layers · @hive/portal"
        title="The docs portal — this site"
        lead="A small local-only documentation website, built with Vite + React. The site you're reading right now."
      />

      <Callout kind="note" title="Local only">
        The portal is <strong>never</strong> served in production. It's a developer
        convenience that runs on your machine only.
      </Callout>

      <Section title="What it is">
        <p>
          Most pages are now <strong>rich hand-built React (JSX) components</strong> —
          with diagrams, callouts, step-by-steps, code blocks, and cross-links — living in{' '}
          <C>portal/src/pages/&lt;group&gt;/&lt;file&gt;.tsx</C>. Any page that hasn't been
          converted yet still renders from its original <C>.md</C> file as a fallback, so
          the site never breaks during conversion.
        </p>
        <Mermaid
          caption="JSX pages and markdown fallbacks are merged into one index; JSX wins per route."
          chart={`
flowchart TD
    JSX["portal/src/pages/*/*.tsx<br/><small>rich components + meta</small>"] --> IDX["content.ts<br/>buildIndex()"]
    MD["about/ rules/ docs/ MINT/<br/><small>markdown fallback</small>"] --> IDX
    IDX --> APP["App.tsx<br/><small>hash router · sidebar · TOC</small>"]
    APP --> SITE["this site"]
`}
        />
      </Section>

      <Section title="Why it exists">
        <ul>
          <li>One premium, searchable place to read about / rules / setup / MINT.</li>
          <li>
            Rich pages can show <strong>diagrams</strong> (Mermaid), labelled callouts,
            numbered steps, copy-to-clipboard code, and internal links between docs.
          </li>
          <li>
            Markdown is still the source of truth for any page not yet converted — the
            portal reads the real <C>.md</C> files live.
          </li>
          <li>
            Nice extras: full-text search (⌘K), dark/light theme, an "on this page"
            outline, and route-based navigation.
          </li>
        </ul>
      </Section>

      <Section title="How to run it">
        <CodeBlock
          lang="bash"
          code={`pnpm hive          # start the dev server on http://localhost:7777
pnpm hive:build    # build a static site into portal/dist/`}
        />
        <p>Under the hood these are:</p>
        <CodeBlock
          lang="bash"
          code={`pnpm --filter @hive/portal dev     # = pnpm hive
pnpm --filter @hive/portal build   # = pnpm hive:build`}
        />
        <p>
          Routes are <strong>hash-based</strong>: <C>#/docs/getting-started</C>,{' '}
          <C>#/about</C>, <C>#/rules</C>, <C>#/mint</C>, etc.
        </p>
      </Section>

      <Section title="How it's built">
        <FileTree
          title="portal/"
          nodes={[
            {
              name: 'src/',
              children: [
                { name: 'pages/<group>/<file>.tsx', note: 'rich JSX docs (each exports meta + a default component)' },
                { name: 'components/ui.tsx', note: 'the design system: Page, Section, Callout, CodeBlock, Steps, Cards, Table, FileTree…' },
                { name: 'components/Mermaid.tsx', note: 'renders Mermaid diagrams, follows the theme' },
                { name: 'content.ts', note: 'merges JSX pages + markdown fallback into one index; builds the nav' },
                { name: 'components/MarkdownView.tsx', note: 'renders markdown-fallback pages' },
                { name: 'components/Search.tsx', note: 'client-side full-text search over every page' },
                { name: 'App.tsx', note: 'shell: top bar, sidebar, content, outline, hash router, theme toggle' },
                { name: 'styles.css', note: 'the premium dark/light theme (honey/amber accent)' },
              ],
            },
            { name: 'vite.config.ts', note: 'dev port (7777); lets Vite read the markdown above portal/' },
          ]}
        />
        <Callout kind="key" title="How a JSX page works">
          Each page file exports <C>meta = &#123; group, file, title, order &#125;</C> and a
          default React component. A Vite glob (<C>import.meta.glob('./pages/*/*.tsx')</C>)
          auto-registers them. Search text is extracted by rendering the component to static
          HTML; the "on this page" outline is built from the auto-slugged headings in the DOM.
        </Callout>
      </Section>

      <Section title="How to extend it">
        <ul>
          <li>
            <strong>Add a new rich page</strong> → create{' '}
            <C>portal/src/pages/&lt;group&gt;/&lt;file&gt;.tsx</C> that exports <C>meta</C> +
            a default component built from the <C>ui.tsx</C> primitives. Use <C>file: 'index'</C>{' '}
            for a group overview.
          </li>
          <li>
            <strong>Add a diagram</strong> → drop a{' '}
            <C>&lt;Mermaid chart="…" caption="…" /&gt;</C> anywhere in a page.
          </li>
          <li>
            <strong>Quick markdown page</strong> → add a <C>.md</C> file into <C>about/</C>,{' '}
            <C>rules/</C>, or <C>docs/</C>; it appears via the fallback.
          </li>
          <li>
            <strong>Change the look</strong> → edit <C>portal/src/styles.css</C>.
          </li>
        </ul>
        <Callout kind="warn">
          Adding a <em>brand-new file</em> needs a portal reload/restart so Vite re-scans the
          folders; editing existing files hot-reloads instantly.
        </Callout>
      </Section>

      <Section title="Gotchas">
        <Callout kind="danger">
          The portal only <strong>reads</strong> docs. It never imports or runs MINT code —
          it only renders MINT's docs, read-only. Because it's a local dev tool rendering
          first-party docs, it renders markdown without a heavy sanitizer; don't point it at
          untrusted markdown.
        </Callout>
      </Section>

      <NextSteps>
        <Card icon="🧭" title="About overview" to="about">
          Browse the concept and layer pages.
        </Card>
        <Card icon="🚀" title="Getting started" to="docs/getting-started">
          Set up the whole monorepo.
        </Card>
      </NextSteps>

      <p className="contact">
        Questions? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
