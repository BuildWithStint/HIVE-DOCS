import {
  Page,
  PageHeader,
  Section,
  Callout,
  CodeBlock,
  Steps,
  Step,
  Table,
  Card,
  C,
  DocLink,
  NextSteps,
} from '../../components/ui';
import { Mermaid } from '../../components/Mermaid';

export const meta = {
  group: 'about',
  file: 'create-a-service',
  title: 'Create & run a service',
  order: 2,
};

export default function CreateAService() {
  return (
    <Page>
      <PageHeader
        kicker="Concepts & Layers"
        title="Create & run a service"
        lead={
          <>
            A service is a small Express app that exposes a REST API and talks to the
            shared database through the repository. This page is the full recipe — from
            an empty folder to a running API and (optionally) a minted standalone copy.
          </>
        }
      />

      <Callout kind="key" title="Run an existing service in one line">
        <CodeBlock lang="bash" code={`cd apps/demo && npm run dev`} />
        That's it — <C>node --watch src/main.ts</C> on <C>http://localhost:4030</C>,
        reloading on save. (Set <C>DB=mongo</C> or <C>DB=postgres</C> to choose the engine.)
      </Callout>

      {/* ------------------------------------------------------------------ */}
      <Section title="Scaffold a new service in one command">
        <p>
          The repo ships a generator that does <strong>every</strong> registration step
          for you — copy the scaffold, rename the package, <strong>assign a unique{' '}
          <C>PORT</C></strong> (from <C>hive.scaffold.portBase + hive.scaffold.portIndex</C>{' '}
          in <C>hive.properties</C>, then bumps the index so the next service gets the next
          free port), register in <C>db.properties</C> and <C>services.ts</C>, add the
          tsconfig reference, install, sync. It does <strong>not</strong> create a table —
          registration is enough. The <strong>Step by step</strong> section below is the
          manual version of the same flow, useful when you want to understand what changed.
        </p>
        <CodeBlock
          lang="bash"
          title="from the repo root"
          code={`# interactive — prompts for the name
node scripts/create-service.mjs

# non-interactive
node scripts/create-service.mjs orders

# skip 'pnpm install' + 'npx nx sync'
node scripts/create-service.mjs orders --no-install`}
        />
        <Callout kind="tip">
          Source lives at <C>scaffold/sample-service/</C> (the template) and{' '}
          <C>scripts/create-service.mjs</C> (the generator). The generator refuses to
          overwrite an existing <C>apps/&lt;name&gt;</C>.
        </Callout>
      </Section>

      {/* ------------------------------------------------------------------ */}
      <Section title="What a service is made of">
        <Mermaid
          caption="Every service has the same small shape — copy apps/demo."
          chart={`
flowchart LR
    M["main.ts<br/><small>set env, listen</small>"] --> A["app.ts<br/><small>json → corePipeline → routes → errorHandler</small>"]
    A --> R["http/routes.ts<br/><small>your REST handlers</small>"]
    R --> RP["dal/make-repository.ts<br/><small>the one data wiring</small>"]
    RP --> DB[("shared database")]
`}
        />
        <Table
          head={['File', 'Responsibility']}
          rows={[
            [<C>src/main.ts</C>, <>Set <C>HIVE_SERVICE_DIR</C>, start listening on a port.</>],
            [<C>src/app.ts</C>, <>Build the Express app: <C>express.json()</C> → <C>corePipeline</C> → routes → <C>errorHandler()</C>.</>],
            [<C>src/lib/http/routes.ts</C>, <>Your REST endpoints. Validate input, call the repository.</>],
            [<C>src/lib/dal/make-repository.ts</C>, <>The single data-access wiring (db type + tenancy).</>],
          ]}
        />
      </Section>

      {/* ------------------------------------------------------------------ */}
      <Section title="Step by step">
        <Steps>
          <Step title="Register the service for the database">
            Open <C>database/db.properties</C> — the single registry — and add your service
            to the <C>services=</C> list (optionally with a{' '}
            <C>service.&lt;name&gt;.*</C> config block). The typed{' '}
            <C>database/services.ts</C> is regenerated from it. This must happen{' '}
            <strong>before</strong> any of its tables, because a table's <C>scope</C> may
            only name a registered service.
            <CodeBlock
              lang="properties"
              title="database/db.properties"
              code={`services=demo,orders   # ← added 'orders'
service.orders.description=Orders service.
service.orders.db=mongo

database=hive
engine=mongo`}
            />
            <CodeBlock
              lang="ts"
              title="database/services.ts (generated)"
              code={`export const SERVICES = {
  demo:    { description: '…', db: 'mongo' },
  orders:  { description: 'Orders service.', db: 'mongo' },   // ← added
} as const satisfies Record<string, ServiceConfig>;`}
            />
          </Step>

          <Step title="Declare its tables">
            Add a <C>database/tables/&lt;name&gt;.table.ts</C> for each table the service
            owns. The scaffold <strong>doesn't</strong> ship one — registration is
            enough — so copy this starter table (it matches the CRUD example in{' '}
            <C>src/lib/dal/example-crud.ts</C>), rename it, and tweak the columns. Use{' '}
            <C>scope: ['&lt;service&gt;']</C> (or include <C>'common'</C> tables that every
            service shares). <C>scope</C> autocompletes from <C>services.ts</C>, so a typo
            is a compile error.
            <CodeBlock
              lang="ts"
              title="database/tables/orders.table.ts"
              code={`import { defineTable } from '../define.ts';

export default defineTable({
  name: 'items',
  scope: ['orders'],                 // ← your service (or 'common')
  columns: {
    id:    { type: 'id' },
    key:   { type: 'string', required: true, unique: true },
    name:  { type: 'string', required: true, index: true },
    qty:   { type: 'number', required: true, default: 0 },
    tags:  { type: 'string[]' },
    orgId: { type: 'string', index: true },   // pooled tenancy stamps it; MINT silo drops it
  },
});`}
            />
            Full detail: <DocLink to="docs/database">Database &amp; schema</DocLink>.
          </Step>

          <Step title="Create the table(s) in the database">
            <CodeBlock
              lang="bash"
              code={`# preview just this service's tables
MINT_REPO=$PWD node MINT/dist/cli/main.js run db --service orders --check

# mongo: writes schema.mongo.json (the service ensures it at boot)
# postgres: writes SQL you then run with psql
MINT_REPO=$PWD node MINT/dist/cli/main.js run db --service orders`}
            />
          </Step>

          <Step title="Scaffold the app">
            Create <C>apps/&lt;name&gt;</C> and copy the shape of{' '}
            <DocLink to="about/demo-service">apps/demo</DocLink>: add{' '}
            <C>@hive/connection</C>, <C>@hive/dal</C>, <C>@hive/security</C> and{' '}
            <C>@hive/middleware</C> as <C>workspace:*</C> deps, then{' '}
            <C>pnpm install &amp;&amp; npx nx sync</C>.
          </Step>

          <Step title="Wire the data access">
            One file decides the engine and tenancy. Pooled (multi-tenant) passes the org
            provider; that's the default in the monorepo.
            <CodeBlock
              lang="ts"
              title="src/lib/dal/make-repository.ts"
              code={`// @mintable
import { Repository, createAdapter, type DbType } from '@hive/dal';
import { currentOrgId } from '@hive/security';

export function makeRepository(): Repository {
  const dbType = (process.env.DB ?? 'mongo') as DbType;
  return new Repository(createAdapter(dbType), currentOrgId);
}`}
            />
          </Step>

          <Step title="Add routes">
            Validate input at the top (throw <C>HttpError(400, …)</C>), then call repository
            methods — never the database directly. The tenant is already set by{' '}
            <C>corePipeline</C>, so every call is auto-scoped.
          </Step>

          <Step title="Run it">
            <CodeBlock
              lang="bash"
              code={`cd apps/orders && npm run dev
# → orders listening on the PORT the scaffold assigned in service.properties`}
            />
          </Step>
        </Steps>
      </Section>

      {/* ------------------------------------------------------------------ */}
      <Section title="Call it">
        <p>
          Handlers behind <C>corePipeline</C> require a bearer token. The dev helper prints
          one that the service accepts locally:
        </p>
        <CodeBlock
          lang="bash"
          code={`TOKEN=$(node src/dev/token.ts org-demo user-demo)

curl localhost:4030/health
curl -XPOST localhost:4030/items -H "authorization: Bearer $TOKEN" \\
  -H 'content-type: application/json' \\
  -d '{"key":"k-1","name":"Widget","qty":25}'
curl localhost:4030/items -H "authorization: Bearer $TOKEN"`}
        />
      </Section>

      {/* ------------------------------------------------------------------ */}
      <Section title="Ship a standalone copy (optional)">
        <p>
          When a customer needs their own dedicated instance, MINT extracts a standalone,
          adapter-free copy — its own inline queries, its own shipped schema, no monorepo:
        </p>
        <CodeBlock
          lang="bash"
          code={`MINT_REPO=$PWD node MINT/dist/cli/main.js extract \\
  --microservice orders --db mongo --token <cred> --mode silo --name orders-acme`}
        />
        <p>
          See <DocLink to="about/how-mint-works">how MINT works</DocLink> for what the copy
          looks like.
        </p>
      </Section>

      <NextSteps>
        <Card icon="🗄️" title="Database & schema" to="docs/database">
          Declare tables and run <C>mint run db</C>.
        </Card>
        <Card icon="📦" title="The demo service" to="about/demo-service">
          The reference service to copy.
        </Card>
        <Card icon="🌊" title="How data flows" to="about/how-data-flows">
          A request from arrival to database and back.
        </Card>
      </NextSteps>
    </Page>
  );
}
