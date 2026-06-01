import {
  Page,
  PageHeader,
  Section,
  Callout,
  CodeBlock,
  C,
  NextSteps,
  Card,
} from '../../components/ui';

export const meta = {
  group: 'rules',
  file: 'coding-standards',
  title: 'Coding standards',
  order: 1,
};

export default function CodingStandards() {
  return (
    <Page>
      <PageHeader
        kicker="Rules"
        title="Coding standards"
        lead="How to write code in HIVE so it stays safe, portable, and consistent."
      />

      <Section title="Language & modules">
        <ul>
          <li>
            <strong>TypeScript, strict mode, ESM</strong> with <C>nodenext</C> resolution.
          </li>
          <li>
            Import local files with the <strong><C>.js</C></strong> extension (even though
            the source is <C>.ts</C>): <C>import &#123; x &#125; from './thing.js';</C>.
          </li>
          <li>No <C>any</C> in <C>src</C> (tests may cast through <C>unknown</C> for fakes).</li>
        </ul>
      </Section>

      <Section title="Architecture principles">
        <ul>
          <li><strong>SOLID, KISS, DRY, YAGNI.</strong></li>
          <li>
            <strong>One responsibility per file.</strong> Translators, ports, adapters, and
            entities live in separate files.
          </li>
          <li>
            <strong>Open/Closed</strong>: add a new file (new adapter, new compiler) instead
            of editing a core/base file.
          </li>
          <li>
            <strong>Dependency Inversion</strong>: depend on interfaces (ports). Don't
            hard-code a DB driver, a JWT library, a logger, or a metrics backend in platform
            code — inject them.
          </li>
        </ul>
      </Section>

      <Section title="Multi-tenant safety (most important)">
        <Callout kind="danger">
          <ul>
            <li>
              Read the tenant only via <C>getOrgIdOrThrow()</C> / the base repository. Never
              read <C>orgId</C> from a header or request body.
            </li>
            <li>Don't add a query path that skips the base repository's tenant filter.</li>
            <li>
              Indexes must be <strong><C>orgId</C>-leading</strong> — build them with{' '}
              <C>tenantIndex(...)</C>.
            </li>
          </ul>
        </Callout>
      </Section>

      <Section title="Security">
        <ul>
          <li>
            SQL: bind values as <C>?</C> parameters; allow-list identifiers; never
            string-concat user input into SQL.
          </li>
          <li>Mongo: escape user input used in <C>contains</C>/regex.</li>
          <li>
            Validate at system boundaries (HTTP handlers, config). Don't add defensive
            checks for things that can't happen.
          </li>
          <li>
            Errors go to <C>next(err)</C>; the central <C>errorHandler</C> formats them.
            Never leak internal details in 500s.
          </li>
        </ul>
      </Section>

      <Section title="Async & errors">
        <ul>
          <li>
            All repository methods are <C>async</C> and <strong>fail closed</strong> (reject)
            when the tenant is missing.
          </li>
          <li>Wrap async route handlers so rejections reach the error middleware.</li>
        </ul>
      </Section>

      <Section title="What NOT to do">
        <Callout kind="warn">
          <ul>
            <li>Don't add features, refactors, comments, or abstractions that weren't asked for.</li>
            <li>Don't add docstrings/types to code you didn't change.</li>
            <li>Don't create a helper for a one-time operation.</li>
          </ul>
        </Callout>
      </Section>

      <Section title="Tests">
        <p>
          Every package has unit tests. Pure functions are tested directly; adapters with
          fakes; the sample service with a live integration test (skips without{' '}
          <C>MONGO_URL</C>). Run before you push:
        </p>
        <CodeBlock lang="bash" code={`npx nx run-many -t typecheck test --all`} />
      </Section>

      <Section title="Docs to keep updated (per package)">
        <ul>
          <li><C>AGENTS.md</C> — what it is + public API.</li>
          <li><C>CONTEXT.md</C> — status, decisions, gotchas, open items.</li>
          <li><C>.instructions.md</C> — the rules specific to that package.</li>
          <li><C>about/&lt;package&gt;.md</C> — the plain-English guide.</li>
        </ul>
      </Section>

      <NextSteps>
        <Card icon="🧩" title="How to add things" to="rules/how-to-add">
          Where to put new code, step by step.
        </Card>
        <Card icon="⚙️" title="Internals" to="docs/internals">
          How the layers fit together.
        </Card>
      </NextSteps>

      <p className="contact">
        Questions? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
