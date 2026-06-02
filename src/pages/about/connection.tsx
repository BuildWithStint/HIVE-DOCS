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
  file: 'connection',
  title: 'connection',
  order: 4,
};

export default function Connection() {
  return (
    <Page>
      <PageHeader
        kicker="Layer · @hive/connection"
        title="connection — env + the database clients"
        lead={
          <>
            The shared, engine-specific plumbing every service needs: a small
            environment resolver and one lazy client per database engine. It owns{' '}
            <em>connecting</em>, nothing else — no queries, no tenancy.
          </>
        }
      />

      <Section title="What it is">
        <p>
          A tiny workspace package (<C>packages/connection</C>) with three pieces,
          exposed as separate subpath imports so a service only pulls in what it uses:
        </p>
        <Table
          head={['Import', 'What it gives you']}
          rows={[
            [<C>@hive/connection/env</C>, <><C>requireEnv(key)</C> / <C>optionalEnv(key, fallback)</C> — read config with a clear precedence and fail closed when a required value is missing.</>],
            [<C>@hive/connection/mongo</C>, <>A lazy <C>MongoClient</C>: <C>getDb()</C>, <C>closeDb()</C>. Reads <C>MONGO_URL</C> + <C>MONGO_DB</C> (default <C>hive</C>).</>],
            [<C>@hive/connection/postgres</C>, <>A lazy <C>pg</C> pool: <C>getPool()</C>, <C>query()</C>, <C>execute()</C>, <C>getClient()</C>, <C>closePool()</C>. Reads <C>POSTGRES_URL</C>.</>],
          ]}
        />
      </Section>

      <Section title="Why it exists">
        <p>
          Connecting to a database is the same boring problem in every service, and it
          is engine-specific. Putting it in one package means a service never re-writes
          client setup, and MINT can <strong>vendor</strong> exactly the one engine an
          extract needs (see <DocLink to="about/how-mint-works">how MINT works</DocLink>).
        </p>
        <Mermaid
          caption="Each engine is fully separate: its own env var, its own client, its own close."
          chart={`
flowchart TD
    ENV["env.ts<br/><small>requireEnv / optionalEnv</small>"]
    MONGO["mongo-connection.ts<br/><small>MONGO_URL → getDb()</small>"]
    PG["postgres-connection.ts<br/><small>POSTGRES_URL → getPool()</small>"]
    ENV --> MONGO
    ENV --> PG
    MONGO --> M[("MongoDB")]
    PG --> P[("Postgres")]
`}
        />
      </Section>

      <Section title="The env resolver">
        <p>Precedence, highest first — the first source that has the key wins:</p>
        <ol>
          <li><C>process.env</C></li>
          <li>service-local <C>env.local</C> / <C>.env</C> (in the service root)</li>
          <li>global <C>env.local</C> (walking up from the service root)</li>
          <li>otherwise <C>requireEnv</C> throws; <C>optionalEnv</C> returns the fallback</li>
        </ol>
        <CodeBlock
          lang="ts"
          code={`import { requireEnv, optionalEnv } from '@hive/connection/env';

const url = requireEnv('MONGO_URL');        // throws if absent
const port = optionalEnv('PORT', '4020');   // fallback when absent`}
        />
        <Callout kind="note" title="Service root">
          The root is <C>process.env.HIVE_SERVICE_DIR ?? process.cwd()</C>. Services set{' '}
          <C>HIVE_SERVICE_DIR</C> once at boot so env files resolve no matter where the
          process is launched from.
        </Callout>
      </Section>

      <Section title="The never-merge rule">
        <Callout kind="warn" title="postgres and sql stay separate">
          Each engine keeps its own connection file and its own env var. We never blur
          a generic <C>sql</C> with the concrete <C>postgres</C> engine: Mongo uses{' '}
          <C>MONGO_URL</C>, Postgres uses <C>POSTGRES_URL</C>. Adding an engine means a
          new file + new env var, not a shared one.
        </Callout>
      </Section>

      <NextSteps>
        <Card icon="🗂️" title="dal" to="about/dal">
          The query language + adapters that sit on top of these clients.
        </Card>
        <Card icon="🌊" title="How data flows" to="about/how-data-flows">
          A request from arrival to database and back.
        </Card>
      </NextSteps>
    </Page>
  );
}
