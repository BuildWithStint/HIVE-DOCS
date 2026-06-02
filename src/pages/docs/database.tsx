import {
  Page,
  PageHeader,
  Section,
  Sub,
  Callout,
  CodeBlock,
  Steps,
  Step,
  Table,
  Cards,
  Card,
  C,
  DocLink,
  NextSteps,
} from '../../components/ui';
import { Mermaid } from '../../components/Mermaid';

export const meta = {
  group: 'docs',
  file: 'database',
  title: 'Database & schema',
  order: 3,
};

export default function Database() {
  return (
    <Page>
      <PageHeader
        kicker="Setup & Reference"
        title="Database & schema"
        lead={
          <>
            Every HIVE service shares <strong>one database</strong>. You declare your
            tables <strong>once</strong> in the <C>schema/</C> folder, and one command —{' '}
            <C>mint run db</C> — tells you exactly what changed and gives you the SQL (or
            applies it to Mongo) to make the database match. No ORM migrations folder to
            hand-edit, no guessing.
          </>
        }
      />

      <Callout kind="key" title="The whole idea in one sentence">
        Describe the tables you want in <C>schema/</C>; run <C>mint run db</C>; it diffs
        what you declared against what's already applied and hands you the change to run.
      </Callout>

      {/* ------------------------------------------------------------------ */}
      <Section title="One shared database">
        <p>
          All services talk to the <strong>same</strong> database. That keeps local dev
          trivial (one connection string) and lets services share common tables (like an
          audit log). To stop two services accidentally fighting over the same table, every
          table is <strong>owned</strong> — it declares which service(s) it belongs to.
        </p>
        <Mermaid
          caption="Many services, one database. Each table is tagged with the service(s) that own it."
          chart={`
flowchart TD
    subgraph SVC["Services"]
      C1["catalog"]
      C2["orders"]
      C3["billing"]
    end
    subgraph DB["🗄️ One shared database"]
      T1["products<br/><small>owner: catalog</small>"]
      T2["order_items<br/><small>owner: catalog, orders</small>"]
      T3["invoices<br/><small>owner: billing</small>"]
      T4["audit_events<br/><small>owner: common = everyone</small>"]
    end
    C1 --> T1
    C1 --> T2
    C2 --> T2
    C3 --> T3
    C1 --> T4
    C2 --> T4
    C3 --> T4
`}
        />
      </Section>

      {/* ------------------------------------------------------------------ */}
      <Section title="The schema folder">
        <p>
          Everything lives in <C>HIVE/schema/</C>. It is plain data — no database driver,
          no logic — so it is easy to read, diff in a PR, and copy into a minted service.
        </p>
        <Table
          head={['File', 'What it is']}
          rows={[
            [<C>db.properties</C>, <>The registry: which services exist, the database name, and the default engine.</>],
            [<C>define.ts</C>, <>The tiny typed helper <C>defineTable(...)</C> — gives you autocomplete and validation.</>],
            [<C>&lt;name&gt;.table.ts</C>, <>One file per table/collection. Its default export is a <C>defineTable(...)</C> call.</>],
            [<C>applied.&lt;engine&gt;.json</C>, <>A lockfile MINT writes: the last state it applied (so it can diff next time).</>],
            [<C>migrations/</C>, <>Generated SQL migration files (Postgres) you run against your database.</>],
          ]}
        />

        <Sub title="A table file" />
        <p>
          Here is the catalog's <C>products</C> table — it mirrors the REST payload exactly:
        </p>
        <CodeBlock
          lang="ts"
          title="schema/products.table.ts"
          code={`import { defineTable } from './define.ts';

export default defineTable({
  name: 'products',
  prefix: ['catalog'],            // owned by the catalog service
  columns: {
    id:     { type: 'id' },                                  // primary key
    sku:    { type: 'string', required: true, unique: true },
    name:   { type: 'string', required: true },
    price:  { type: 'number', required: true },
    tags:   { type: 'string[]' },
    active: { type: 'boolean', default: true },
    orgId:  { type: 'string', index: true },                 // tenancy column
  },
});`}
        />

        <Sub title="The registry: db.properties" />
        <CodeBlock
          lang="properties"
          title="schema/db.properties"
          code={`# Comma-separated list of services allowed to own tables.
services=catalog

# Logical database name (Mongo db / SQL schema). Same for every service.
database=hive

# Default engine for \`mint run db\` when --db is not passed.
engine=mongo`}
        />
        <Callout kind="warn" title="Register a new service before its tables">
          A table's <C>prefix</C> may only name <C>common</C> or a service listed in{' '}
          <C>services=</C>. Add your service there first (it's the first step of{' '}
          <DocLink to="about/create-a-service">creating a service</DocLink>).
        </Callout>
      </Section>

      {/* ------------------------------------------------------------------ */}
      <Section title="Ownership: the prefix">
        <p>
          The <C>prefix</C> array is the one idea that makes everything else simple. It
          says <strong>who owns the table</strong> — and therefore which minted services
          carry it.
        </p>
        <Table
          head={['prefix', 'Meaning', 'Shipped when you mint…']}
          rows={[
            [<C>['common']</C>, 'Shared by EVERY service.', 'every service'],
            [<C>['catalog']</C>, 'Owned by just the catalog service.', 'catalog'],
            [<C>['catalog', 'orders']</C>, 'Shared by exactly those two services.', 'catalog or orders'],
          ]}
        />
        <Callout kind="note" title="Why this matters for MINT">
          When MINT extracts the <C>catalog</C> service it ships exactly the tables whose
          prefix contains <C>common</C> or <C>catalog</C> — no more, no less. See{' '}
          <DocLink to="about/how-mint-works">how MINT works</DocLink>.
        </Callout>
      </Section>

      {/* ------------------------------------------------------------------ */}
      <Section title="Column types">
        <p>
          Seven neutral types. MINT maps each to the right native type per engine, so you
          never write engine-specific DDL:
        </p>
        <Table
          head={['type', 'Postgres', 'Mongo', 'Use for']}
          rows={[
            [<C>id</C>, <C>TEXT PRIMARY KEY</C>, <C>_id → string id</C>, 'the primary key'],
            [<C>string</C>, <C>TEXT</C>, 'string', 'names, sku, text'],
            [<C>number</C>, <C>DOUBLE PRECISION</C>, 'number', 'price, quantity'],
            [<C>boolean</C>, <C>BOOLEAN</C>, 'boolean', 'flags like active'],
            [<C>string[]</C>, <C>TEXT[]</C>, 'array', 'tags, labels'],
            [<C>timestamp</C>, <C>TIMESTAMPTZ</C>, 'Date', 'created/updated times'],
            [<C>json</C>, <C>JSONB</C>, 'object', 'free-form metadata'],
          ]}
        />
        <p>Each column also takes optional flags:</p>
        <Table
          head={['flag', 'Effect']}
          rows={[
            [<C>required: true</C>, <>SQL <C>NOT NULL</C>; required by convention in Mongo.</>],
            [<C>unique: true</C>, <>SQL <C>UNIQUE</C> constraint / Mongo unique index.</>],
            [<C>index: true</C>, <>A secondary index (SQL <C>CREATE INDEX</C> / Mongo <C>createIndex</C>).</>],
            [<C>default: …</C>, <>A literal default value (SQL <C>DEFAULT</C>).</>],
          ]}
        />
      </Section>

      {/* ------------------------------------------------------------------ */}
      <Section title="mint run db — the one command">
        <p>
          From the repo root, <C>mint run db</C> loads the schema, validates ownership,
          diffs against what's already applied, and either prints the SQL to run (Postgres)
          or reconciles the live database (Mongo).
        </p>
        <CodeBlock
          lang="bash"
          code={`# from HIVE/
MINT_REPO=$PWD node MINT/dist/cli/main.js run db [--db mongo|postgres] [--service <name>] [--check] [--name <label>]`}
        />
        <Table
          head={['Flag', 'What it does']}
          rows={[
            [<C>--db mongo|postgres</C>, <>Pick the engine (defaults to <C>engine=</C> in db.properties).</>],
            [<C>--service &lt;name&gt;</C>, <>Only the tables that service owns (common + its own).</>],
            [<C>--check</C>, <>Dry run: show the diff, write nothing, apply nothing.</>],
            [<C>--name &lt;label&gt;</C>, <>Label the generated SQL migration file.</>],
          ]}
        />

        <Mermaid
          caption="The same flow for both engines: load → validate → diff. SQL is handed to you; Mongo is reconciled live."
          chart={`
flowchart TD
    A["read schema/*.table.ts<br/>+ db.properties"] --> B["validate ownership<br/><small>every prefix is registered</small>"]
    B --> C{"engine?"}
    C -->|postgres| D["diff vs applied.postgres.json"]
    D --> E["write migrations/&lt;stamp&gt;.sql<br/>print: psql -f &lt;file&gt;"]
    C -->|mongo| F["read live db<br/>(collections + indexes)"]
    F --> G["create what's missing<br/>(idempotent)"]
`}
        />
      </Section>

      {/* ------------------------------------------------------------------ */}
      <Section title="Postgres: you get a migration to run">
        <p>
          Postgres needs explicit DDL, so MINT never touches your database. It writes a
          dated, reviewable <C>.sql</C> file and tells you the exact command to run:
        </p>
        <CodeBlock
          lang="bash"
          code={`$ MINT_REPO=$PWD node MINT/dist/cli/main.js run db --db postgres --name init

Schema: 2 table(s) (whole database) on postgres.

+ create table audit_events (5 columns)
+ create table products (7 columns)

Wrote migration: schema/migrations/2026-…_init.sql
Run it: psql "$POSTGRES_URL" -f schema/migrations/2026-…_init.sql`}
        />
        <p>The generated SQL is plain and safe to read:</p>
        <CodeBlock
          lang="sql"
          title="schema/migrations/…_init.sql"
          code={`CREATE TABLE IF NOT EXISTS "products" (
  "id" TEXT PRIMARY KEY,
  "sku" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "tags" TEXT[],
  "active" BOOLEAN DEFAULT true,
  "orgId" TEXT
);
CREATE INDEX IF NOT EXISTS "idx_products_orgId" ON "products" ("orgId");`}
        />
        <Callout kind="tip" title="Add a column later? You get an ALTER, not a rewrite">
          Change a table file and re-run: MINT emits only{' '}
          <C>ALTER TABLE … ADD COLUMN IF NOT EXISTS …</C> for the new column. It{' '}
          <strong>never drops</strong> a table or column — a removed table is reported as a
          comment so you decide.
        </Callout>
      </Section>

      {/* ------------------------------------------------------------------ */}
      <Section title="Mongo: it reconciles the live database">
        <p>
          Mongo is schemaless, so there is no DDL to hand you. Instead MINT connects, reads
          what already exists, and creates only what's missing (collections + indexes). The
          live database <em>is</em> the previous state:
        </p>
        <CodeBlock
          lang="bash"
          code={`$ MINT_REPO=$PWD node MINT/dist/cli/main.js run db --db mongo

Schema: 2 table(s) (whole database) on mongo.

+ create collection audit_events
+ index audit_events.orgId
+ unique index products.sku
+ index products.orgId

✓ Applied to Mongo db 'hive'.`}
        />
        <p>Run it again and it is a no-op — it only ever adds what's missing:</p>
        <CodeBlock lang="bash" code={`Up to date — Mongo db 'hive' already matches.`} />
      </Section>

      {/* ------------------------------------------------------------------ */}
      <Section title="The everyday workflow">
        <Steps>
          <Step title="Declare or change a table">
            Add a <C>schema/&lt;name&gt;.table.ts</C> (or edit an existing one). Register a
            new service in <C>db.properties</C> first.
          </Step>
          <Step title="Preview the change">
            <CodeBlock lang="bash" code={`MINT_REPO=$PWD node MINT/dist/cli/main.js run db --check`} />
            See exactly what would change. Nothing is written or applied.
          </Step>
          <Step title="Apply it">
            <CodeBlock
              lang="bash"
              code={`# mongo: applies live
MINT_REPO=$PWD node MINT/dist/cli/main.js run db --db mongo

# postgres: writes the SQL, then you run it
MINT_REPO=$PWD node MINT/dist/cli/main.js run db --db postgres --name my-change
psql "$POSTGRES_URL" -f schema/migrations/…_my-change.sql`}
            />
          </Step>
        </Steps>
      </Section>

      {/* ------------------------------------------------------------------ */}
      <Section title="FAQ">
        <Cards cols={1}>
          <Card icon="❓" title="Do I write SQL or Mongo queries here?">
            No. You only declare neutral tables in <C>schema/</C>. MINT translates to the
            engine. Your service code uses the repository (<DocLink to="about/dal">dal</DocLink>),
            never raw queries.
          </Card>
          <Card icon="❓" title="Will it ever delete my data?">
            Never. Postgres only does <C>CREATE</C> / <C>ALTER … ADD COLUMN</C>; a dropped
            table is a comment, not a <C>DROP</C>. Mongo only creates missing
            collections/indexes.
          </Card>
          <Card icon="❓" title="What's the orgId column for?">
            Multi-tenancy. Pooled services stamp + scope every row by <C>orgId</C>; a minted
            silo drops the column entirely. See <DocLink to="about/how-data-flows">how data flows</DocLink>.
          </Card>
          <Card icon="❓" title="How does a minted service get its tables?">
            MINT ships them inside the extract: <C>db/schema.sql</C> (Postgres) or{' '}
            <C>db/schema.mongo.json</C> (Mongo) for exactly the tables that service owns.
          </Card>
          <Card icon="❓" title="Why is there a lockfile (applied.*.json)?">
            So the next run can diff. It records the last state MINT applied, which is how it
            knows to emit an <C>ALTER</C> instead of re-creating everything.
          </Card>
        </Cards>
      </Section>

      <NextSteps>
        <Card icon="🧱" title="Create a service" to="about/create-a-service">
          Add a service and register it for the shared database.
        </Card>
        <Card icon="🗃️" title="dal" to="about/dal">
          How service code reads/writes without raw queries.
        </Card>
        <Card icon="🪄" title="How MINT works" to="about/how-mint-works">
          How a minted service ships its own schema.
        </Card>
      </NextSteps>
    </Page>
  );
}
