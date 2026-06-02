import {
  Page,
  PageHeader,
  Section,
  Callout,
  Table,
  CodeBlock,
  C,
  DocLink,
  NextSteps,
  Card,
} from '../../components/ui';
import { Mermaid } from '../../components/Mermaid';

export const meta = {
  group: 'about',
  file: 'dal',
  title: 'dal',
  order: 5,
};

export default function Dal() {
  return (
    <Page>
      <PageHeader
        kicker="Layer · @hive/dal"
        title="dal — the common query + the engine adapters"
        lead={
          <>
            The whole data-access layer in one shared package: a neutral query
            language, a repository that runs it, three engine adapters, and a factory.
            A service only brings <strong>its query and its db type</strong>; everything
            generic lives here.
          </>
        }
      />

      <Section title="What it is">
        <p><C>packages/dal</C> exports four things:</p>
        <Table
          head={['Piece', 'What it is']}
          rows={[
            [<C>QuerySpec</C>, <>The common HIVE query — neutral, no Mongo/SQL syntax. An <C>entity</C>, an <C>operation</C> (FETCH / FETCH_ONE / INSERT / UPDATE / DELETE / COUNT), <C>filters</C>, <C>sort</C>, <C>pagination</C>, optional <C>data</C>, optional <C>tenantId</C>.</>],
            [<C>DatabaseAdapter</C>, <>One method: <C>execute(spec)</C> → rows / count / the native query. Each engine implements it.</>],
            [<C>Repository</C>, <>Thin convenience over an adapter: <C>fetch, fetchOne, insert, update, remove, count</C>. Tenancy is <strong>injected</strong> via a <C>TenantProvider</C>, not hard-coded.</>],
            [<C>createAdapter(dbType)</C>, <>The factory: <C>mongo</C> → Mongo adapter, <C>postgres</C> → Postgres adapter, <C>sql</C> → the portable adapter (needs a caller-supplied executor).</>],
          ]}
        />
      </Section>

      <Section title="Three engines, kept separate">
        <Table
          head={['Engine', 'Adapter', 'Notes']}
          rows={[
            [<C>mongo</C>, <C>mongo-adapter.ts</C>, <>Talks the Mongo driver via <DocLink to="about/connection">@hive/connection/mongo</DocLink>.</>],
            [<C>sql</C>, <C>sql-adapter.ts</C>, <>Portable ANSI SQL. Driver-neutral: you inject a <C>SqlExecutor</C>. Not a CLI extract target on its own.</>],
            [<C>postgres</C>, <C>postgres-adapter.ts</C>, <>Concrete Postgres: extends the SQL adapter with a Postgres dialect (<C>$1</C> placeholders, <C>ILIKE</C>, <C>RETURNING</C>) over <DocLink to="about/connection">@hive/connection/postgres</DocLink>.</>],
          ]}
        />
        <Callout kind="warn" title="postgres is not sql">
          <C>sql</C> is the portable base; <C>postgres</C> is one concrete engine built
          on it. They keep separate names, ids and connections — we never merge them.
        </Callout>
      </Section>

      <Section title="Why it exists">
        <p>
          We want to write a feature once and run it on Mongo or Postgres, so business
          code must never contain <C>$gte</C> or <C>WHERE</C>. It describes intent with{' '}
          <C>QuerySpec</C>; the chosen adapter translates that to the engine's own
          syntax. Putting all of this in a package keeps services thin and lets MINT{' '}
          <strong>replace</strong> the whole layer with one concrete file of inline queries
          (the chosen engine, no adapter) in a standalone extract.
        </p>
        <Mermaid
          caption="Business code speaks neutral QuerySpec; the factory picks one adapter; the adapter translates per engine."
          chart={`
flowchart TD
    BC["service code<br/><small>neutral QuerySpec + db type</small>"] --> REPO["Repository<br/><small>injected tenant provider</small>"]
    REPO --> F["createAdapter(dbType)"]
    F --> MA["mongo-adapter"] --> DB1[("MongoDB")]
    F --> PA["postgres-adapter"] --> DB2[("Postgres")]
    F --> SA["sql-adapter<br/><small>injected executor</small>"] --> DB3[("any SQL")]
`}
        />
      </Section>

      <Section title="What a service actually writes">
        <p>
          Just the query and the db type. Tenancy is decided at wiring time (pooled
          passes a tenant provider; a silo extract passes none):
        </p>
        <CodeBlock
          lang="ts"
          code={`import { Repository, createAdapter, type DbType } from '@hive/dal';

export function makeRepository(): Repository {
  const dbType = (process.env.DB ?? 'mongo') as DbType;
  return new Repository(createAdapter(dbType) /*, currentOrgId */);
}`}
        />
        <Callout kind="note" title="After MINT">
          That's the <strong>monorepo</strong> shape (generic adapter + factory). A minted
          standalone copy has no adapter at all — MINT replaces this layer with one concrete{' '}
          <C>src/lib/dal/index.ts</C> of inline queries for the chosen engine. See{' '}
          <DocLink to="about/how-mint-works">how MINT works</DocLink>.
        </Callout>
      </Section>

      <NextSteps>
        <Card icon="🔌" title="connection" to="about/connection">
          The env + database clients the adapters use.
        </Card>
        <Card icon="🌊" title="How data flows" to="about/how-data-flows">
          A request from arrival to database and back.
        </Card>
        <Card icon="🪄" title="How MINT works" to="about/how-mint-works">
          How an extract replaces dal with inline queries.
        </Card>
      </NextSteps>
    </Page>
  );
}
