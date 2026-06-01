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
} from '../../components/ui';
import { Mermaid } from '../../components/Mermaid';

export const meta = {
  group: 'docs',
  file: 'testing-postgres',
  title: 'Testing with Postgres',
  order: 4,
};

export default function TestingPostgres() {
  return (
    <Page>
      <PageHeader
        kicker="Setup & Reference"
        title="Testing against PostgreSQL"
        lead="You don't need PostgreSQL installed on your machine. Pick one of the options below, then point DATABASE_URL at it in env.local."
      />

      <Section title="Already verified: in-process Postgres (zero setup)">
        <p>
          The SQL flow is verified end-to-end against a <strong>real Postgres engine
          running in-process</strong> via PGlite (Postgres compiled to WASM — no
          Docker, no server). Run it any time:
        </p>
        <CodeBlock
          lang="bash"
          code={`npx nx build @hive/dal-sql
node packages/dal-sql/scripts/verify-postgres.mjs`}
        />
        <Mermaid
          caption="What verify-postgres.mjs runs, in order. It prints 'PostgreSQL flow OK' when all checks pass."
          chart={`
flowchart LR
    A["defineSchema"] --> B["compileToSql"]
    B --> C["migrate<br/>(CREATE TABLE)"]
    C --> D["SqlRepository CRUD"]
    D --> E["tenant isolation<br/>checks"]
    E --> OK(["PostgreSQL flow OK ✅"])
`}
        />
        <Callout kind="note" title="Why a real engine, not just fakes?">
          Running this for real caught a bug: the SQL adapter emitted{' '}
          <strong>unquoted</strong> identifiers while the schema compiler emits{' '}
          <strong>double-quoted</strong> ones, so generated queries didn't match the
          migrated tables (<C>syntax error at or near "USER"</C>). The adapter now
          quotes identifiers to match.
        </Callout>
        <p>
          The options below are for testing against a <strong>standalone</strong>{' '}
          Postgres (e.g. to point a running service at it).
        </p>
      </Section>

      <Section title="Option A — Docker (recommended, one command)">
        <p>If you have Docker:</p>
        <CodeBlock
          lang="bash"
          code={`docker run --name hive-pg \\
  -e POSTGRES_PASSWORD=hive \\
  -e POSTGRES_USER=hive \\
  -e POSTGRES_DB=hive \\
  -p 5432:5432 \\
  -d postgres:16`}
        />
        <p>Then add to <C>env.local</C> (git-ignored):</p>
        <CodeBlock lang="bash" title="env.local" code={`DATABASE_URL=postgres://hive:hive@localhost:5432/hive`} />
        <p>Stop / start / remove later:</p>
        <CodeBlock
          lang="bash"
          code={`docker stop hive-pg
docker start hive-pg
docker rm -f hive-pg`}
        />
        <Sub title="Quick sanity check (creates a table via the schema layer)" />
        <p>
          The <C>dal-sql</C> adapter and the schema migrator use an injected executor.
          A minimal <C>pg</C>-backed executor looks like this (Postgres uses <C>$1</C>{' '}
          placeholders, so we rewrite <C>?</C> → <C>$n</C>):
        </p>
        <CodeBlock
          lang="ts"
          code={`import { Client } from 'pg';
import { migrateSql, defineSchema, type DdlExecutor } from '@hive/schema';

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const ddlExecutor: DdlExecutor = {
  execute: (sql) => client.query(sql),
};

const NOTE = defineSchema({
  name: 'NOTE',
  scope: 'demo',                 // -> table DEMO_NOTE
  fields: [{ name: 'text', type: 'string', required: true,
             description: 'Body of the note.' }],
});

await migrateSql(ddlExecutor, [NOTE]);   // CREATE TABLE IF NOT EXISTS "DEMO_NOTE" ...
console.log('created DEMO_NOTE');
await client.end();`}
        />
        <p>
          To run actual repository queries, wrap <C>pg</C> as a <C>SqlExecutor</C>{' '}
          (rewriting <C>?</C> to <C>$n</C>) and use <C>SqlRepository</C> — see{' '}
          <DocLink to="about/dal-sql">the SQL adapter</DocLink>.
        </p>
      </Section>

      <Section title="Option B — Free hosted Postgres (no Docker)">
        <p>
          Create a free database on any of these and copy its connection string into{' '}
          <C>env.local</C> as <C>DATABASE_URL</C>:
        </p>
        <Table
          head={['Provider', 'Notes']}
          rows={[
            ['Neon — neon.tech', 'Serverless Postgres, generous free tier'],
            ['Supabase — supabase.com', 'Postgres + dashboard'],
            ['Railway — railway.app', 'Simple hosted Postgres'],
          ]}
        />
        <CodeBlock
          lang="bash"
          title="env.local"
          code={`DATABASE_URL=postgres://USER:PASSWORD@HOST/DBNAME?sslmode=require`}
        />
        <Callout kind="note">
          Most hosted Postgres requires SSL — keep <C>?sslmode=require</C>.
        </Callout>
      </Section>

      <Section title="Option C — Just see the SQL (no database at all)">
        <p>
          If you only want to verify the generated DDL is correct, you don't need a
          database — print it:
        </p>
        <CodeBlock
          lang="ts"
          code={`import { compileToSql, defineSchema } from '@hive/schema';

const NOTE = defineSchema({
  name: 'NOTE', scope: 'demo',
  fields: [{ name: 'text', type: 'string', required: true }],
});

console.log(compileToSql(NOTE, { ifNotExists: true }));`}
        />
        <p>This prints the <C>CREATE TABLE</C> + index statements you would run.</p>
      </Section>

      <Section title="What to hand me to test in Postgres">
        <p>
          To run the SQL path live (like we did for Mongo), provide <strong>one</strong> of:
        </p>
        <ol>
          <li>
            a <C>DATABASE_URL</C> from Option A or B (kept in <C>env.local</C>, never
            committed; rotate it afterwards), <strong>or</strong>
          </li>
          <li>
            confirmation to spin up the Docker container above and share the resulting{' '}
            <C>DATABASE_URL</C>.
          </li>
        </ol>
        <p>
          With that, a SQL-backed integration test mirroring the TASKS Mongo test can
          be added.
        </p>
      </Section>

      <p className="contact">
        Questions? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
