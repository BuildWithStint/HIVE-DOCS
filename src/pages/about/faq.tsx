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
  order: 8,
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
          service for a customer, <strong>vendors the data layer</strong> (the{' '}
          <C>@hive/dal</C> query core + the one chosen engine adapter, plus{' '}
          <C>@hive/connection</C>) into the copy and rewrites the imports, shapes it for a
          shared ("pooled") or single-tenant ("silo") install, and{' '}
          <strong>taste-tests</strong> the result before handing it over.
          The order of those steps is <strong>frozen</strong> for safety. Full story:{' '}
          <DocLink to="about/how-mint-works">how MINT works</DocLink>.
        </p>
      </Section>

      <Section title="Is the PostgreSQL flow actually supported, or only MongoDB?">
        <p>
          <strong>Both are first-class.</strong> Each engine has its own adapter in{' '}
          <DocLink to="about/dal">@hive/dal</DocLink> and its own client in{' '}
          <DocLink to="about/connection">@hive/connection</DocLink>.
        </p>
        <ul>
          <li>
            Mongo: the <DocLink to="about/demo-service">demo service</DocLink>{' '}
            exercises insert / fetch (all filter ops) / fetchOne / count / update /
            delete against a real MongoDB via <C>POST /demo</C>.
          </li>
          <li>
            Postgres: the <C>postgres-adapter</C> extends the portable SQL adapter with a
            Postgres dialect (<C>$1</C> placeholders, <C>ILIKE</C>, <C>RETURNING</C>) over
            <C>@hive/connection/postgres</C>.
          </li>
        </ul>
        <Callout kind="note">
          The portable <C>sql</C> adapter and the concrete <C>postgres</C> adapter are
          kept separate — same query language, different dialect. See{' '}
          <DocLink to="docs/testing-postgres">testing with Postgres</DocLink>.
        </Callout>
      </Section>

      <Section title="Where does a service's schema live now?">
        <p>
          A service owns its own entities. There is no shared schema package: the{' '}
          <DocLink to="about/dal">@hive/dal</DocLink> query language is engine-neutral,
          so a service just names its <C>entity</C> in each <C>QuerySpec</C> and lets the
          chosen adapter map it to a Mongo collection or a Postgres table.
        </p>
      </Section>

      <Section title="How do I create a new microservice?">
        <p>
          Copy the shape of{' '}
          <DocLink to="about/demo-service">apps/demo</DocLink>: an{' '}
          <C>app.ts</C> pipeline (<C>express.json()</C> → core pipeline → routes →{' '}
          <C>errorHandler()</C>), a <C>main.ts</C> that sets <C>HIVE_SERVICE_DIR</C> and
          listens, and a single <C>make-repository.ts</C> that picks the db type and
          tenancy. Everything else comes from <DocLink to="about/connection">@hive/connection</DocLink>{' '}
          and <DocLink to="about/dal">@hive/dal</DocLink>. Exact files and order:{' '}
          <DocLink to="rules/how-to-add">how to add things</DocLink>.
        </p>
      </Section>

      <Section title="How is tenant isolation guaranteed?">
        <p>
          The request pipeline resolves <C>orgId</C> from the verified token and stores
          it in <C>AsyncLocalStorage</C>. In the pooled build the repository's injected
          tenant provider (<C>currentOrgId</C>) reads it and the adapter scopes{' '}
          <strong>every</strong> query by it; it fails closed if no tenant is in scope.
          Routes never read <C>orgId</C> from the body or headers. See{' '}
          <DocLink to="about/demo-service">the demo service</DocLink> and{' '}
          <DocLink to="about/dal">@hive/dal</DocLink>.
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
