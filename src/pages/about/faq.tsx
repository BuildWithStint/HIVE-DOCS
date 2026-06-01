import {
  Page,
  PageHeader,
  Section,
  Callout,
  CodeBlock,
  C,
  DocLink,
} from '../../components/ui';

export const meta = {
  group: 'about',
  file: 'faq',
  title: 'FAQ',
  order: 3,
};

export default function Faq() {
  return (
    <Page>
      <PageHeader
        kicker="Concepts & Layers"
        title="FAQ"
        lead="Short answers to the questions people ask most. Each one links to the deeper doc."
      />

      <Callout kind="tip" title="Want the full beginner-friendly explanations?">
        Read the two deep dives:{' '}
        <DocLink to="about/how-data-flows">how a request talks to the database</DocLink>{' '}
        and <DocLink to="about/how-mint-works">how MINT works and extracts</DocLink>.
      </Callout>

      <Section title="How does a request actually reach the database?">
        <p>
          Short version: the token proves who you are → your <C>orgId</C> is parked on
          a per-request "notepad" (AsyncLocalStorage) → your business code asks a
          repository for data <strong>without</strong> mentioning the tenant → a frozen
          base repository <strong>automatically</strong> stamps/filters by that{' '}
          <C>orgId</C> → an engine adapter turns the neutral query into MongoDB or SQL →
          the result is cleaned and returned. You can never forget the tenant filter
          because the base always adds it. Full trace:{' '}
          <DocLink to="about/how-data-flows">how data flows</DocLink>.
        </p>
      </Section>

      <Section title="How does MINT &quot;extract&quot;, in plain words?">
        <p>
          Think of a <strong>magic photocopier</strong>: it checks your ID, copies the
          platform for a customer, <strong>swaps our secret-sauce pieces</strong> (e.g.
          the fast range id-allocator) for shippable equivalents (the simple counter
          allocator), shapes it for a shared ("pooled") or single-tenant ("silo")
          install, and <strong>taste-tests</strong> the result before handing it over.
          The order of those steps is <strong>frozen</strong> for safety. Full story:{' '}
          <DocLink to="about/how-mint-works">how MINT works</DocLink>.
        </p>
      </Section>

      <Section title="Is the PostgreSQL flow actually tested, or only MongoDB?">
        <p>
          <strong>Both are tested live.</strong>
        </p>
        <ul>
          <li>
            Mongo: the sample service{' '}
            (<DocLink to="about/sample-tasks-service">@hive/tasks</DocLink>) runs 11
            integration tests against a real MongoDB.
          </li>
          <li>
            Postgres: <C>packages/dal-sql/scripts/verify-postgres.mjs</C> runs the full
            SQL path against a <strong>real Postgres engine in-process</strong> (PGlite
            — no Docker, no server):
          </li>
        </ul>
        <CodeBlock
          lang="bash"
          code={`npx nx build @hive/dal-sql
node packages/dal-sql/scripts/verify-postgres.mjs`}
        />
        <Callout kind="note">
          Running it for real caught a bug: the SQL adapter emitted{' '}
          <strong>unquoted</strong> identifiers while the schema compiler emits{' '}
          <strong>double-quoted</strong> ones. The adapter now quotes identifiers
          consistently. See <DocLink to="docs/testing-postgres">testing with Postgres</DocLink>.
        </Callout>
      </Section>

      <Section title="&quot;Common&quot; vs &quot;service&quot; schema — what's the difference?">
        <ul>
          <li>
            <strong>Common</strong> (<C>scope: 'common'</C>): a shared table, no name
            prefix (e.g. <C>USER</C>). Put it in{' '}
            <DocLink to="about/models-common">@hive/models-common</DocLink> so every
            service reuses it.
          </li>
          <li>
            <strong>Service</strong> (<C>scope: '&lt;service&gt;'</C>): owned by one
            service; the physical name is prefixed (e.g. scope <C>tasks</C> +{' '}
            <C>TASK</C> → <C>TASKS_TASK</C>).
          </li>
        </ul>
        <p>
          Either way you write <strong>one</strong> <C>defineSchema(...)</C>; the system
          injects <C>id</C>, <C>orgId</C>, and audit columns and makes every index{' '}
          <C>orgId</C>-leading. Full details:{' '}
          <DocLink to="about/schema">the schema layer</DocLink>.
        </p>
      </Section>

      <Section title="How do I create a new microservice?">
        <p>
          Copy the shape of{' '}
          <DocLink to="about/sample-tasks-service">apps/tasks</DocLink>: generate a
          package under <C>apps/&lt;name&gt;</C>, add a <C>service.properties</C>,
          wire <strong>schema → model → repository</strong>, a real <C>TokenVerifier</C>,
          then <C>createApp</C> (<C>express.json()</C> → <C>corePipeline</C> → routes →{' '}
          <C>errorHandler()</C>), and a <C>main.ts</C> that loads config, connects the
          DB, and listens. Exact files and order:{' '}
          <DocLink to="rules/how-to-add">how to add things</DocLink>.
        </p>
      </Section>

      <Section title="How is tenant isolation guaranteed?">
        <p>
          Middleware resolves <C>orgId</C> from the verified token and stores it in
          AsyncLocalStorage. The base repository reads it via <C>getOrgIdOrThrow()</C>{' '}
          and injects it into <strong>every</strong> query; it fails closed (rejects) if
          no tenant is in scope. Routes never read <C>orgId</C> from the body or headers.
          See <DocLink to="about/tenant-context">tenant-context</DocLink> and{' '}
          <DocLink to="about/dal-core">dal-core</DocLink>.
        </p>
      </Section>

      <Section title="Why do my imports use .js when the files are .ts?">
        <p>
          ESM with <C>nodenext</C> resolution requires the runtime extension. Write{' '}
          <C>import &#123; x &#125; from './thing.js';</C> even though the source is{' '}
          <C>thing.ts</C>. See{' '}
          <DocLink to="rules/coding-standards">coding standards</DocLink>.
        </p>
      </Section>

      <Section title="I added a workspace dep and get TS2307: Cannot find module.">
        <p>
          Run <C>pnpm install</C>, then <C>npx nx sync</C> (sometimes twice) to wire the
          TypeScript project references, then build.
        </p>
      </Section>

      <Section title="How do I read the docs as web pages?">
        <CodeBlock
          lang="bash"
          code={`pnpm hive
# open http://localhost:7777  → #/docs #/about #/rules #/mint`}
        />
        <p>
          It renders <C>about/</C>, <C>rules/</C>, <C>docs/</C>, and MINT's docs as a
          premium, searchable site (Vite + React). It's <strong>local only</strong> and
          never runs in production. See <DocLink to="about/devportal">the docs portal</DocLink>.
        </p>
      </Section>

      <Section title="What is MINT and can I run it?">
        <p>
          MINT is the proprietary extraction/packaging tool (in <C>/MINT</C>, kept out
          of the platform repo). Don't run, change, or ship it without coordinating
          first. See <DocLink to="about/mint">mint</DocLink> and{' '}
          <DocLink to="rules/mint">the MINT rules</DocLink>.
        </p>
      </Section>

      <p className="contact">
        Questions not covered here? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
