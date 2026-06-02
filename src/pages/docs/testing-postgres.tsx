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
  order: 5,
};

export default function TestingPostgres() {
  return (
    <Page>
      <PageHeader
        kicker="Setup & Reference"
        title="Testing against PostgreSQL"
        lead="The same neutral query runs on Postgres via the postgres-adapter. Point POSTGRES_URL at any Postgres in env.local, then run the service (or a MINT extract) with DB=postgres."
      />

      <Section title="How the Postgres path is wired">
        <p>
          The <C>postgres-adapter</C> in <DocLink to="about/dal">@hive/dal</DocLink>{' '}
          extends the portable <C>sql-adapter</C> with a Postgres dialect, and talks to
          the database through <DocLink to="about/connection">@hive/connection/postgres</DocLink>{' '}
          (which reads <C>POSTGRES_URL</C>). Values are always bound as parameters
          (<C>$1, $2, …</C>) — never glued into the SQL text.
        </p>
        <Mermaid
          caption="The same QuerySpec, translated to parameterized Postgres SQL."
          chart={`
flowchart LR
    SPEC["QuerySpec"] --> PA["postgres-adapter<br/><small>$1 placeholders, ILIKE, RETURNING</small>"]
    PA --> CONN["@hive/connection/postgres<br/><small>POSTGRES_URL → pg pool</small>"]
    CONN --> DB[("Postgres")]
`}
        />
        <Callout kind="warn" title="postgres is not sql">
          The portable <C>sql</C> adapter (driver-neutral, injected executor) and the
          concrete <C>postgres</C> adapter are kept separate — same query, different
          dialect and connection.
        </Callout>
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
        <CodeBlock lang="bash" title="env.local" code={`POSTGRES_URL=postgres://hive:hive@localhost:5432/hive`} />
        <p>Stop / start / remove later:</p>
        <CodeBlock
          lang="bash"
          code={`docker stop hive-pg
docker start hive-pg
docker rm -f hive-pg`}
        />
      </Section>

      <Section title="Option B — Free hosted Postgres (no Docker)">
        <p>
          Create a free database on any of these and copy its connection string into{' '}
          <C>env.local</C> as <C>POSTGRES_URL</C>:
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
          code={`POSTGRES_URL=postgres://USER:PASSWORD@HOST/DBNAME?sslmode=require`}
        />
        <Callout kind="note">
          Most hosted Postgres requires SSL — keep <C>?sslmode=require</C>.
        </Callout>
      </Section>

      <Section title="Run it">
        <Sub title="As the service" />
        <p>
          Set <C>DB=postgres</C> so <C>make-repository</C> selects the Postgres adapter:
        </p>
        <CodeBlock
          lang="bash"
          code={`DB=postgres node apps/demo/src/main.ts
curl -s -X POST http://localhost:4030/demo -H 'x-org-id: org-A'`}
        />
        <Sub title="As a standalone MINT extract" />
        <p>Extract a Postgres copy that vendors the postgres adapter + connection:</p>
        <CodeBlock
          lang="bash"
          code={`MINT_REPO=$PWD node MINT/dist/cli/main.js extract \\
  --microservice demo --db postgres --mode silo \\
  --name demo-pg --token local-dev`}
        />
        <Callout kind="note">
          Keep <C>POSTGRES_URL</C> in <C>env.local</C> only (never commit it), and rotate
          shared credentials afterwards.
        </Callout>
      </Section>

      <p className="contact">
        Questions? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
