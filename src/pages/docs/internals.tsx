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
  order: 3,
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
            explains the machinery <em>inside</em> it — the classes, the data, and
            the design choices — in plain language.
          </>
        }
      />

      <Callout kind="key" title="The four golden rules behind all of this">
        <ol>
          <li>
            <strong>Tenant isolation is central and unskippable</strong> — enforced
            by one frozen base class.
          </li>
          <li>
            <strong>Business code is engine-neutral</strong> — no Mongo/SQL words
            leak in.
          </li>
          <li>
            <strong>Fail closed</strong> — missing tenant/token/config means refuse,
            never guess.
          </li>
          <li>
            <strong>Dependency Inversion</strong> — inject drivers, loggers,
            verifiers, so everything is easy to test.
          </li>
        </ol>
      </Callout>

      <Section title="The layer stack at a glance">
        <p>
          A request falls down this stack from top to bottom, then the answer climbs
          back up. Each box has exactly one job.
        </p>
        <Mermaid
          caption="The main request path (top to bottom). schema and config sit beside it, feeding every layer."
          chart={`
flowchart TD
    REQ([HTTP request]) --> OBS["observability<br/><small>give the request an id, start timing</small>"]
    OBS --> MW["middleware<br/><small>requestContext → authenticate → tenant</small>"]
    MW --> SEC["security<br/><small>verify token → claims</small>"]
    SEC --> TC["tenant-context<br/><small>park orgId on a per-request notepad</small>"]
    TC --> ROUTES["your routes<br/><small>normal business code</small>"]
    ROUTES --> CORE["dal-core<br/><small>frozen base: stamp + filter by orgId</small>"]
    CORE --> ADP["dal-mongoose / dal-sql<br/><small>translate neutral query → Mongo / SQL</small>"]
    ADP --> DB[("database")]
    SCHEMA["schema<br/><small>describe a table once</small>"] -. feeds .-> CORE
    CONFIG["config<br/><small>constants + secrets</small>"] -. feeds .-> MW
`}
        />
      </Section>

      <Section title="1. tenant-context — the per-request notepad">
        <Table
          head={['', '']}
          rows={[
            [<strong>Job</strong>, 'Remember "who is this request for?" (orgId) without passing it through every function by hand.'],
            [<strong>Inside</strong>, "Wraps Node's AsyncLocalStorage — a sticky note that travels with the request, even across await points."],
          ]}
        />
        <ul>
          <li>
            <C>runWithTenant(&#123; orgId &#125;, fn)</C> — runs <C>fn</C> with the note
            attached.
          </li>
          <li>
            <C>getOrgIdOrThrow()</C> — reads the note; if there's no note (no tenant
            in scope) it <strong>throws</strong>. That's "fail closed": no tenant →
            no data.
          </li>
        </ul>
        <Callout kind="note" title="Why it matters">
          Because the orgId lives here, the data layer can read it automatically.
          Nobody has to remember to pass it down, so nobody can forget.
        </Callout>
      </Section>

      <Section title="2. security — proving who you are">
        <p>
          <strong>Job:</strong> turn an opaque token into trusted <strong>claims</strong>{' '}
          (<C>sub</C> = user, <C>orgId</C> = tenant, roles, …).
        </p>
        <p>
          <strong>Inside:</strong> it defines a <strong>port</strong> (an interface)
          called <C>TokenVerifier</C> with one method, <C>verify(token) → claims</C>.
          The platform never hard-codes <em>how</em> a token is checked — a service
          injects a real verifier (e.g. a JWT verifier).
        </p>
        <ul>
          <li>
            <C>authenticate</C> uses the injected verifier. Bad/missing token →{' '}
            <strong>401</strong>, and the request stops before touching the database.
          </li>
          <li>
            <C>authorize</C> checks roles/permissions for routes that need them.
          </li>
        </ul>
        <Callout kind="danger" title="The sample verifier is demo-only">
          The sample service ships a <C>SampleTokenVerifier</C> for local demos.
          Never use it in production — inject a real JWT verifier.
        </Callout>
      </Section>

      <Section title="3. middleware — the assembly line (Tier-1)">
        <p>
          <strong>Job:</strong> run the right steps, in the right order, for every
          request. <C>corePipeline(&#123; verifier &#125;)</C> returns an ordered list
          of Express handlers. <strong>The order is fixed</strong> and must not change.
        </p>
        <Mermaid
          caption="Tier-1 order is fixed. Tier-2 middleware slots between your routes and the error handler."
          chart={`
flowchart LR
    A["1. requestContext<br/><small>assign requestId</small>"] --> B["2. authenticate<br/><small>verify token</small>"]
    B --> C["3. tenant<br/><small>runWithTenant(orgId)</small>"]
    C --> R["your routes"]
    R --> T2["Tier-2<br/><small>rate-limit, validation</small>"]
    T2 --> E["errorHandler<br/><small>always last</small>"]
`}
        />
        <Callout kind="warn" title="Why fixed order?">
          You must know <em>who</em> (authenticate) before you set <em>which tenant</em>{' '}
          (tenant), and error handling must be last so it catches everything. Tier-2
          middleware goes <strong>after</strong> <C>corePipeline</C> and{' '}
          <strong>before</strong> <C>errorHandler</C>. Never reorder Tier-1.
        </Callout>
      </Section>

      <Section title="4. dal-core — the data contract + frozen core">
        <p>This is the heart. It has two parts.</p>

        <Sub title="(a) The neutral query language" />
        <p>
          Business code never writes Mongo's <C>$gte</C> or SQL's <C>WHERE</C>. It
          writes a small, declarative <C>QuerySpec</C>:
        </p>
        <CodeBlock
          lang="ts"
          code={`{
  where: [{ field: 'priority', op: 'gte', value: 3 }],
  sort:  [{ field: 'id', direction: 'asc' }],
  limit: 20,
  offset: 0,
}`}
        />
        <p>
          The operators are deliberately limited to ones <strong>every</strong> engine
          supports: <C>eq, ne, gt, gte, lt, lte, in, contains</C>. If an operator
          can't work on all engines, it doesn't go in.
        </p>

        <Sub title="(b) The frozen base repository" />
        <p>
          <C>AbstractBaseRepository</C> is the class every adapter extends. It does
          the tenant work <strong>once</strong>, so no service can skip it:
        </p>
        <Mermaid
          caption="What the frozen base does automatically on every operation."
          chart={`
flowchart TD
    subgraph Base["AbstractBaseRepository (frozen)"]
      READ["read → merge orgId filter"]
      CREATE["create → strip id/orgId,<br/>allocate id, stamp orgId + timestamps"]
      UPD["update/delete → re-apply tenant filter"]
      GUARD{"tenant in scope?"}
    end
    GUARD -- "no" --> REJECT["reject (fail closed)"]
    GUARD -- "yes" --> READ
    READ --> EX["execute* hooks"]
    CREATE --> EX
    UPD --> EX
    EX --> ADP["engine adapter fills these in"]
`}
        />
        <Table
          head={['Operation', 'What the base guarantees']}
          rows={[
            ['Every read', <>Merges <C>orgId = current tenant</C> into the query. Pass an empty query and you still only see your tenant's rows.</>],
            ['Every create', <>Strips any <C>id/_id/orgId</C> a caller sent, allocates a fresh id, stamps <C>orgId</C> from the notepad, sets <C>createdAt/updatedAt</C>.</>],
            ['Every update/delete', "Re-applies the tenant filter — you can't touch another tenant's row even by id."],
            ['No tenant in scope', 'Every method rejects (fails closed).'],
          ]}
        />
        <Callout kind="key" title="Open/Closed principle">
          The base contains <strong>zero</strong> Mongo/SQL — only the rules. Add a
          new engine by adding a new adapter, never by editing the base.
        </Callout>

        <Sub title="(c) Sequential ids" />
        <p>
          HIVE uses boring sequential numbers (1, 2, 3…) via an <C>IdAllocator</C> so
          ids look identical on Mongo and SQL.
        </p>
      </Section>

      <Section title="5. dal-mongoose — the MongoDB adapter">
        <p>
          <strong>Job:</strong> implement the <C>execute*</C> hooks using Mongoose,
          and translate <C>QuerySpec</C> → Mongo.
        </p>
        <ul>
          <li>
            <C>MongooseRepository&lt;T&gt;</C> extends the base and has{' '}
            <strong>no tenant logic</strong> — the base already added the filter.
          </li>
          <li>
            <C>mongoose-query.ts</C> converts a <C>QuerySpec</C> into a Mongo
            filter/sort. <C>contains</C> becomes a <strong>safe</strong> regex: special
            characters in user input are escaped first, so a user can't inject a
            malicious regex.
          </li>
          <li>
            <C>to-domain.ts</C> cleans a raw Mongo document (<C>_id</C>, <C>__v</C>)
            into a tidy domain object (<C>id</C>, no <C>__v</C>).
          </li>
        </ul>
        <Sub title="Id allocation (two strategies)" />
        <Table
          head={['Allocator', 'How', 'Used by']}
          rows={[
            [<C>CounterAllocator</C>, 'One atomic increment per insert, gap-free.', <>Shipped to clients via <DocLink to="about/how-mint-works">MINT</DocLink>.</>],
            [<C>RangeReservationAllocator</C>, 'Reserves blocks of ids for speed.', 'HIVE-internal "secret sauce"; MINT swaps it for the counter version.'],
          ]}
        />
      </Section>

      <Section title="6. dal-sql — the SQL/Postgres adapter">
        <p>
          <strong>Job:</strong> the same <C>execute*</C> hooks, but emitting SQL.
        </p>
        <ul>
          <li>
            <C>SqlRepository&lt;T&gt;</C> extends the base; <C>sql-query.ts</C> turns a{' '}
            <C>QuerySpec</C> into a <C>WHERE</C> + <C>ORDER BY</C>, always binding
            values as <strong>parameters</strong> (<C>?</C>), never gluing user input
            into the SQL string. That's how SQL injection is prevented.
          </li>
          <li>
            <strong>Identifiers are double-quoted</strong> (<C>"orgId"</C>,{' '}
            <C>"TASKS_TASK"</C>) to match what the schema compiler emits.
          </li>
        </ul>
        <Callout kind="note" title="A real bug this caught">
          The adapter once emitted <em>unquoted</em> identifiers while the schema
          compiler emits <em>double-quoted</em> ones, so queries didn't match the
          migrated tables. That's why we test against a live engine — see{' '}
          <DocLink to="docs/testing-postgres">testing with Postgres</DocLink>.
        </Callout>
      </Section>

      <Section title="7. schema — describe a table once, generate everything">
        <p>
          <strong>Job:</strong> you write <strong>one</strong> description of a table;
          the system produces the SQL table, the Mongo indexes, and the TypeScript
          type.
        </p>
        <Mermaid
          caption="One source of truth, three generated outputs — zero drift."
          chart={`
flowchart LR
    DEF["defineSchema(...)"] --> SQL["compileToSql → CREATE TABLE"]
    DEF --> MONGO["mongoIndexCommands → indexes"]
    DEF --> TYPES["compileToTypes → TS interface"]
`}
        />
        <ul>
          <li>
            <C>scope: 'common'</C> → a shared table with <strong>no</strong> prefix
            (e.g. <C>USER</C>). <C>scope: 'tasks'</C> + <C>TASK</C> →{' '}
            <C>TASKS_TASK</C>.
          </li>
          <li>
            It <strong>injects</strong> the managed columns for you: <C>id</C>,{' '}
            <C>orgId</C>, <C>createdAt</C>, <C>updatedAt</C>, <C>deletedAt</C>. You
            never declare them.
          </li>
          <li>
            Every index is <strong>orgId-leading</strong>, so tenant-scoped queries
            stay fast.
          </li>
        </ul>
      </Section>

      <Section title="8. config — layered constants and secrets">
        <p>
          <strong>Job:</strong> give every layer its settings, with secrets kept out
          of git. <C>loadConfig(&#123; rootDir, serviceDir &#125;)</C> merges sources
          in priority order:
        </p>
        <CodeBlock
          lang="text"
          code={`hive.properties  <  service.properties  <  env.local  <  process.env`}
        />
        <ul>
          <li>
            <C>getRequired(key)</C> — returns the value or <strong>throws</strong> if
            missing (fail closed).
          </li>
          <li>
            <C>getNumber</C> / <C>getBoolean</C> / <C>getString(key, default)</C> —
            typed reads.
          </li>
        </ul>
        <Callout kind="warn" title="A gotcha that bit us">
          Always pass <C>rootDir</C> so <C>hive.properties</C> is found even when the
          process starts from another folder.
        </Callout>
      </Section>

      <Section title="9. observability — logs and metrics that know the tenant">
        <p>
          <strong>Job:</strong> structured logging + metrics that automatically
          include <C>requestId</C> and <C>orgId</C>, so you can trace one request or
          one tenant. A <C>StructuredLogger</C> emits JSON log lines; because the
          tenant lives on the notepad, logs are tagged with it without extra
          plumbing.
        </p>
      </Section>

      <Section title="10. models-common — the shared entities">
        <p>
          <strong>Job:</strong> entities that <strong>every</strong> service shares —{' '}
          <C>User</C>, <C>Org</C>, and the RBAC (role/permission) tables — plus
          helpers. They use <C>scope: 'common'</C> so they have no service prefix and
          can be reused everywhere.
        </p>
      </Section>

      <Section title="11. apps/tasks — how it's all assembled">
        <p>The sample service ties every layer together:</p>
        <Mermaid
          caption="The wiring of the sample Tasks service."
          chart={`
flowchart TD
    SCHEMA["TASK schema"] --> MODEL["Mongoose model"]
    MODEL --> REPO["TaskRepository extends MongooseRepository"]
    REPO --> APP["createApp: express.json → corePipeline → routes → errorHandler"]
    APP --> MAIN["main.ts: loadConfig → connect Mongo → listen"]
    MAIN --> TEST["integration test proves org-B can't see org-A's tasks"]
`}
        />
        <p>
          Read it alongside{' '}
          <DocLink to="about/sample-tasks-service">the sample Tasks service</DocLink>{' '}
          to see each wire in code.
        </p>
      </Section>

      <Section title="How MINT fits (the packaging tool)">
        <p>
          MINT is <strong>not</strong> a runtime layer — it's a separate, private
          tool that produces a <strong>shippable copy</strong> of the platform for a
          customer. It swaps HIVE-internal "secret sauce" (like the range
          id-allocator) for shippable equivalents (the counter allocator), and can
          reshape a service for a single tenant ("silo" mode). Full story:{' '}
          <DocLink to="about/how-mint-works">how MINT works</DocLink>.
        </p>
      </Section>

      <Section title="One-paragraph summary">
        <Callout kind="key">
          Each layer has one job and a clean seam (a port or a base class) to the
          next. Identity is proven once (<C>security</C>), parked once
          (<C>tenant-context</C>), and enforced once (<C>dal-core</C>'s frozen base),
          so tenant isolation can't be skipped. Business code speaks a neutral query
          language, and small per-engine adapters translate it — which is why HIVE
          can run on MongoDB today and SQL tomorrow without touching business code.
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
