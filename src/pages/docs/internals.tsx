import {
  Page,
  PageHeader,
  Section,
  Sub,
  Callout,
  CodeBlock,
  Table,
  C,
  DocLink,
  NextSteps,
  Card,
} from '../../components/ui';
import { Mermaid } from '../../components/Mermaid';

export const meta = {
  group: 'docs',
  file: 'internals',
  title: 'How every layer works internally',
  order: 4,
};

export default function Internals() {
  return (
    <Page>
      <PageHeader
        kicker="Setup & Reference"
        title="How every layer works internally"
        lead={
          <>
            The engine-room tour. <DocLink to="about/how-data-flows">How data flows</DocLink>{' '}
            follows one request from the outside; this page opens up each layer and
            explains the machinery <em>inside</em> it — in plain language. Today the
            stack is three pieces: <DocLink to="about/connection">@hive/connection</DocLink>,{' '}
            <DocLink to="about/dal">@hive/dal</DocLink>, and a thin service.
          </>
        }
      />

      <Callout kind="key" title="The four golden rules behind all of this">
        <ol>
          <li>
            <strong>Tenant isolation is central and unskippable</strong> — enforced by
            the <C>@hive/dal</C> Repository + its injected tenant provider.
          </li>
          <li>
            <strong>Business code is engine-neutral</strong> — no Mongo/SQL words leak
            in; it speaks <C>QuerySpec</C>.
          </li>
          <li>
            <strong>Fail closed</strong> — missing tenant/env means refuse, never guess.
          </li>
          <li>
            <strong>Dependency Inversion</strong> — inject the tenant provider, the SQL
            executor, the db type, so everything is easy to test and to ship.
          </li>
        </ol>
      </Callout>

      <Section title="The layer stack at a glance">
        <p>
          A request falls down this stack from top to bottom, then the answer climbs
          back up. Each box has exactly one job.
        </p>
        <Mermaid
          caption="The main request path (top to bottom). connection feeds the adapters."
          chart={`
flowchart TD
    REQ([HTTP request]) --> TIMER["request timer<br/><small>assign requestId, start timing</small>"]
    TIMER --> MW["core pipeline<br/><small>verify token → runWithTenant(orgId)</small>"]
    MW --> ROUTES["your routes<br/><small>normal business code</small>"]
    ROUTES --> REPO["@hive/dal Repository<br/><small>stamp + filter by orgId</small>"]
    REPO --> ADP["mongo / postgres adapter<br/><small>translate QuerySpec → Mongo / SQL</small>"]
    ADP --> DB[("database")]
    CONN["@hive/connection<br/><small>env + DB client</small>"] -. feeds .-> ADP
`}
        />
      </Section>

      <Section title="1. connection — env + the database client">
        <Table
          head={['', '']}
          rows={[
            [<strong>Job</strong>, 'Resolve config and hand back one lazy client per engine. Nothing else.'],
            [<strong>Inside</strong>, <>An env resolver (<C>requireEnv</C> / <C>optionalEnv</C>) and one connection file per engine (<C>mongo-connection.ts</C>, <C>postgres-connection.ts</C>).</>],
          ]}
        />
        <ul>
          <li>
            <C>requireEnv(key)</C> throws when a required value is missing (fail closed);{' '}
            <C>optionalEnv(key, fallback)</C> returns a default.
          </li>
          <li>
            Each engine keeps its own env var (<C>MONGO_URL</C> / <C>POSTGRES_URL</C>)
            and its own close (<C>closeDb</C> / <C>closePool</C>). We never merge engines.
          </li>
        </ul>
        <Callout kind="note" title="Why it matters">
          Because connecting lives here, every service and every MINT extract reuses the
          exact same, engine-specific plumbing. See{' '}
          <DocLink to="about/connection">connection</DocLink>.
        </Callout>
      </Section>

      <Section title="2. dal — the neutral query language">
        <p>
          Business code never writes Mongo's <C>$gte</C> or SQL's <C>WHERE</C>. It writes
          a small, declarative <C>QuerySpec</C>:
        </p>
        <CodeBlock
          lang="ts"
          code={`{
  entity: 'products',
  operation: 'FETCH',
  filters: [{ field: 'price', op: 'lt', value: 1000 }],
  sort:    [{ field: 'price', direction: 'desc' }],
  pagination: { limit: 10, offset: 0 },
}`}
        />
        <p>
          The operators are deliberately limited to ones <strong>every</strong> engine
          supports: <C>eq, ne, gt, gte, lt, lte, in, nin, contains</C>. If an operator
          can't work on all engines, it doesn't go in.
        </p>
      </Section>

      <Section title="3. dal — the Repository">
        <p>
          <C>Repository</C> is the thin convenience over an adapter:{' '}
          <C>fetch, fetchOne, insert, update, remove, count</C>. Tenancy is{' '}
          <strong>injected</strong>, not hard-coded:
        </p>
        <Mermaid
          caption="The Repository applies the injected tenant, then calls the adapter's one execute() method."
          chart={`
flowchart TD
    subgraph Repo["Repository"]
      TP["tenantProvider?.()"] --> SPEC["build QuerySpec (tenantId)"]
      SPEC --> EX["adapter.execute(spec)"]
    end
    EX --> ADP["engine adapter"]
`}
        />
        <Table
          head={['Operation', 'What the Repository does']}
          rows={[
            ['Every fetch', <>Passes the current <C>tenantId</C> (from the provider) into the spec; the adapter scopes by <C>orgId</C>.</>],
            ['Every insert', <>Carries the <C>tenantId</C> so the adapter stamps <C>orgId</C> on the new row.</>],
            ['Every update/remove', 'The tenant filter is re-applied — you can\u2019t touch another tenant\u2019s row even by id.'],
            ['Pooled vs silo', <>Pooled passes <C>currentOrgId</C> as the provider; a silo extract passes none and runs unscoped for one tenant.</>],
          ]}
        />
        <Callout kind="key" title="Open/Closed principle">
          The Repository contains <strong>zero</strong> Mongo/SQL — only the wiring. Add
          a new engine by adding a new adapter, never by editing the Repository.
        </Callout>
      </Section>

      <Section title="4. dal — the engine adapters">
        <p>Each adapter implements one method, <C>execute(spec)</C>, and returns rows + count + the native query it ran.</p>

        <Sub title="(a) mongo-adapter" />
        <ul>
          <li>
            Translates <C>QuerySpec</C> → a Mongo filter/sort and calls the driver via{' '}
            <C>@hive/connection/mongo</C>.
          </li>
          <li>
            <C>contains</C> becomes a <strong>safe</strong> regex: special characters in
            user input are escaped first, so a user can't inject a malicious regex.
          </li>
          <li>Maps Mongo's <C>_id</C> to a string <C>id</C> on the way out.</li>
        </ul>

        <Sub title="(b) sql-adapter (portable) and postgres-adapter (concrete)" />
        <ul>
          <li>
            <C>sql-adapter</C> emits portable ANSI SQL over an injected{' '}
            <C>SqlExecutor</C>, always binding values as <strong>parameters</strong> —
            never gluing user input into the SQL string. That's how SQL injection is
            prevented.
          </li>
          <li>
            <C>postgres-adapter</C> extends it with a Postgres dialect (<C>$1</C>{' '}
            placeholders, <C>ILIKE</C>, <C>RETURNING</C>) over{' '}
            <C>@hive/connection/postgres</C>.
          </li>
        </ul>
        <Callout kind="warn" title="postgres is not sql">
          The portable <C>sql</C> base and the concrete <C>postgres</C> engine keep
          separate names and connections. See{' '}
          <DocLink to="docs/testing-postgres">testing with Postgres</DocLink>.
        </Callout>
      </Section>

      <Section title="5. the service — tenancy + the request pipeline">
        <p>
          A service (e.g. <DocLink to="about/demo-service">apps/demo</DocLink>) owns
          only what's service-specific: its routes, its db type, and its tenancy.
        </p>
        <Mermaid
          caption="Tier-1 order is fixed. Tier-2 middleware slots between routes and the error handler."
          chart={`
flowchart LR
    A["1. requestContext<br/><small>assign requestId</small>"] --> B["2. authenticate<br/><small>verify token</small>"]
    B --> C["3. tenant<br/><small>runWithTenant(orgId)</small>"]
    C --> R["your routes"]
    R --> T2["Tier-2<br/><small>timing, validation</small>"]
    T2 --> E["errorHandler<br/><small>always last</small>"]
`}
        />
        <ul>
          <li>
            <strong>Tenancy</strong> uses Node's <C>AsyncLocalStorage</C>:{' '}
            <C>runWithTenant(&#123; orgId &#125;, fn)</C> parks the orgId;{' '}
            <C>currentOrgId()</C> reads it and throws if no tenant is in scope.
          </li>
          <li>
            <C>make-repository.ts</C> is the one DAL wiring: it picks the db type and
            passes <C>currentOrgId</C> (pooled) or nothing (silo).
          </li>
        </ul>
        <Callout kind="warn" title="Why fixed order?">
          You must know <em>who</em> (authenticate) before you set <em>which tenant</em>{' '}
          (tenant), and error handling must be last so it catches everything. Never
          reorder Tier-1.
        </Callout>
      </Section>

      <Section title="How MINT fits (the packaging tool)">
        <p>
          MINT is <strong>not</strong> a runtime layer — it's a separate, private tool
          that produces a <strong>shippable copy</strong> of a service for a customer. On
          extract it <strong>vendors</strong> <C>@hive/connection</C> and{' '}
          <C>@hive/dal</C> (the query core + the one chosen adapter) into the output and
          rewrites the imports, so the copy runs standalone with no workspace. It can
          reshape a service for a single tenant ("silo" mode). Full story:{' '}
          <DocLink to="about/how-mint-works">how MINT works</DocLink>.
        </p>
      </Section>

      <Section title="One-paragraph summary">
        <Callout kind="key">
          Identity is proven once (the pipeline) and parked once (<C>AsyncLocalStorage</C>),
          and enforced once (the <C>@hive/dal</C> Repository's injected tenant provider),
          so tenant isolation can't be skipped. Business code speaks a neutral query
          language, and small per-engine adapters translate it — which is why a service
          can run on MongoDB or Postgres without touching business code, and why MINT can
          vendor the whole data layer into a standalone copy.
        </Callout>
      </Section>

      <NextSteps>
        <Card icon="🌊" title="Follow one request" to="about/how-data-flows">
          The same machinery, traced from the outside in.
        </Card>
        <Card icon="🪄" title="How MINT works" to="about/how-mint-works">
          How a shippable copy is made.
        </Card>
      </NextSteps>

      <p className="contact">
        Questions? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
