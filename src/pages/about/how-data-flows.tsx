import {
  Page,
  PageHeader,
  Section,
  Callout,
  CodeBlock,
  Table,
  Steps,
  Step,
  C,
  DocLink,
  NextSteps,
  Card,
} from '../../components/ui';
import { Mermaid } from '../../components/Mermaid';

export const meta = {
  group: 'about',
  file: 'how-data-flows',
  title: 'How data flows (deep dive)',
  order: 1,
};

export default function HowDataFlows() {
  return (
    <Page>
      <PageHeader
        kicker="Deep dive"
        title="How a request talks to the database"
        lead="This page follows one real request from the moment it arrives until the answer comes back, and explains every step in plain language. By the end you'll understand exactly how HIVE keeps each tenant's data separate — and how the same code can talk to MongoDB or SQL."
      />

      <Section title="A picture first (the apartment building)">
        <p>
          Imagine an <strong>apartment building</strong>. Many families
          (tenants/organizations) live in it. They share the same building (one
          running service) and the same mailroom (one database). But:
        </p>
        <ul>
          <li>
            Every letter (row of data) has a <strong>family name on it</strong>{' '}
            (<C>orgId</C>).
          </li>
          <li>
            There is <strong>one security guard</strong> at the mailroom (the "frozen
            core"). Every time anyone asks for mail, the guard <em>automatically</em>{' '}
            only gives them letters with <strong>their own</strong> family name.
          </li>
          <li>
            A resident <strong>cannot</strong> walk past the guard. There is no side
            door.
          </li>
        </ul>
        <Callout kind="key">
          That security guard is the most important idea in HIVE. Everything below is
          just the guard doing their job.
        </Callout>
      </Section>

      <Section title="The cast (who does what)">
        <Table
          head={['Name', 'Real thing', 'Job in one line']}
          rows={[
            ['The doorman', <C>middleware</C>, 'Checks your ID badge and remembers who you are'],
            ['The notepad', <C>AsyncLocalStorage</C>, 'Holds "the current family name" for this request'],
            ['The security guard', <><C>@hive/dal</C> Repository</>, 'Adds the family-name filter to every query (via the injected tenant provider)'],
            ['The translator', <>{' '}<C>mongo-adapter</C> / <C>postgres-adapter</C></>, 'Turns a neutral request into Mongo/SQL words'],
            ['The mailroom', 'MongoDB / PostgreSQL', 'Actually stores and returns the letters'],
          ]}
        />
      </Section>

      <Section title="Step by step: create a task, then list my tasks">
        <p>Say a user from <strong>org-A</strong> sends:</p>
        <CodeBlock
          lang="http"
          code={`POST /tasks      Authorization: Bearer <token>      { "title": "Buy milk" }`}
        />
        <Mermaid
          caption="The full create journey. Notice the orgId comes from the verified token, and the route never sets it."
          chart={`
sequenceDiagram
    participant U as User (org-A)
    participant MW as middleware + security
    participant TC as AsyncLocalStorage (notepad)
    participant R as your route
    participant Core as @hive/dal Repository (guard)
    participant Adp as adapter (translator)
    participant DB as database
    U->>MW: POST /tasks (Bearer token)
    MW->>MW: verify token → claims (orgId = org-A)
    Note over MW: bad/missing token → 401, stop
    MW->>TC: runWithTenant({ orgId: org-A })
    TC->>R: handler runs
    R->>Core: repo.create({ title: 'Buy milk' })
    Core->>Core: strip id/orgId, allocate id=1, stamp orgId + timestamps
    Core->>Adp: executeInsert(row)
    Adp->>DB: INSERT / save (values bound as params)
    DB-->>Adp: stored row
    Adp-->>R: clean domain object
    R-->>U: 201 Created
`}
        />
        <Steps>
          <Step title="The doorman checks your badge (middleware + security)">
            <p>
              <C>authenticate</C> takes the token and asks a <C>TokenVerifier</C> "is
              this real, and who is it?". The verifier returns <strong>claims</strong>,
              including <C>sub</C> (the user) and the user's <C>orgId</C> (here,{' '}
              <C>org-A</C>). Missing or fake token → <strong>401</strong>, nothing
              touches the database.
            </p>
            <Callout kind="key" title="Where the family name comes from">
              The <C>orgId</C> comes from the <strong>verified token</strong>, never
              from the URL or JSON body. A user cannot type a different <C>orgId</C> to
              peek at another tenant.
            </Callout>
          </Step>
          <Step title="The notepad remembers who you are (AsyncLocalStorage)">
            <p>
              The <C>tenant</C> middleware writes{' '}
              <C>&#123; orgId: 'org-A', userId, requestId &#125;</C> onto a per-request
              notepad called <strong>AsyncLocalStorage</strong> — a sticky note that
              travels with this one request automatically, even through <C>await</C>s.
              From now on, <C>getOrgIdOrThrow()</C> can read "the current family name
              is org-A".
            </p>
          </Step>
          <Step title="Your route does normal business code">
            <p>
              Your handler runs <C>repo.create(&#123; title: 'Buy milk' &#125;)</C>.
              Notice what's <strong>missing</strong>: you did not write <C>orgId</C>.
              You don't set it, and you <em>can't</em> (the input type forbids it). The
              platform stamps it for you.
            </p>
          </Step>
          <Step title="The security guard adds the family name (@hive/dal)">
            <p>The Repository + adapter. For a create it does three things:</p>
            <Table
              head={['Step', 'What happens']}
              rows={[
                ['Sanitize input', <>Throws away any <C>id</C> or <C>orgId</C> a caller tried to sneak in.</>],
                ['Stamp the tenant', <>Reads <C>org-A</C> from the notepad (the injected tenant provider) and attaches it.</>],
                ['Generate the id', <>The adapter creates the stored id and returns it as a string <C>id</C>.</>],
              ]}
            />
            <p>
              So <C>&#123; title: 'Buy milk' &#125;</C> becomes{' '}
              <C>&#123; id, orgId: 'org-A', title: 'Buy milk' &#125;</C>.
              Then it calls the adapter's <C>execute(spec)</C> for the INSERT.
            </p>
          </Step>
          <Step title="The translator speaks the database's language (adapter)">
            <Table
              head={['Engine', 'What it becomes']}
              rows={[
                [<C>mongo-adapter</C>, <>An <C>insertOne</C>. The id maps to Mongo's <C>_id</C> and back to a string <C>id</C>.</>],
                [<C>postgres-adapter</C>, <><C>INSERT INTO products (...) VALUES ($1, $2, …) RETURNING *</C> with values <strong>bound as parameters</strong> — never glued into the text (stops SQL injection).</>],
              ]}
            />
          </Step>
          <Step title="The answer travels home">
            <p>
              The adapter converts the raw record into a clean object (<C>to-domain</C>:
              Mongo's <C>_id</C> becomes <C>id</C>, internal fields like <C>__v</C> are
              dropped). Your route returns it as JSON with <strong>201 Created</strong>.
            </p>
          </Step>
        </Steps>
      </Section>

      <Section title="Now the read: GET /tasks — where isolation really shines">
        <p>
          The same user calls <C>GET /tasks</C>. The badge + notepad steps are
          identical. Then:
        </p>
        <ul>
          <li>
            Your route calls <C>repo.findMany()</C>. You wrote <strong>no filter at
            all</strong>.
          </li>
          <li>
            The guard takes your (empty) query and <strong>merges in</strong> the
            tenant condition: "where <C>orgId = 'org-A'</C>".
          </li>
          <li>
            The translator turns that into <C>find(&#123; orgId: 'org-A' &#125;)</C>{' '}
            (Mongo) or <C>SELECT * FROM products WHERE "orgId" = $1</C> (SQL).
          </li>
        </ul>
        <Mermaid
          caption="Same code, same database, completely separate views — because the guard merges in each caller's own orgId."
          chart={`
flowchart TD
    subgraph A["org-A calls GET /tasks"]
      A1["repo.findMany() — no filter"] --> A2["guard adds orgId = org-A"] --> A3[("only org-A rows")]
    end
    subgraph B["org-B calls GET /tasks"]
      B1["repo.findMany() — no filter"] --> B2["guard adds orgId = org-B"] --> B3[("only org-B rows")]
    end
`}
        />
        <Callout kind="note" title="Proven by real tests">
          The demo service has an "org-B cannot see org-A" behaviour against live
          MongoDB, and the Postgres path uses the same neutral query through its own
          adapter. See <DocLink to="about/dal">@hive/dal</DocLink>.
        </Callout>
      </Section>

      <Section title="The neutral query language (why two databases just work)">
        <p>
          Your code never writes Mongo's <C>$gte</C> or SQL's <C>&gt;=</C>. It writes a{' '}
          <strong>neutral</strong> <C>QuerySpec</C>:
        </p>
        <CodeBlock
          lang="ts"
          code={`{ where: [{ field: 'priority', op: 'gte', value: 3 }],
  sort:  [{ field: 'id', direction: 'asc' }],
  limit: 20 }`}
        />
        <Table
          head={['Neutral', 'MongoDB', 'SQL']}
          rows={[
            [<C>op: 'gte'</C>, <C>{`{ priority: { $gte: 3 } }`}</C>, <C>"priority" &gt;= ?</C>],
            [<C>op: 'contains'</C>, 'safe regex (input escaped)', <C>LIKE ? ESCAPE '\\'</C>],
            [<C>sort asc</C>, <C>.sort(&#123; id: 1 &#125;)</C>, <C>ORDER BY "id" ASC</C>],
          ]}
        />
        <p>
          Because the recipe only contains operators <strong>every</strong> engine
          supports, swapping MongoDB for SQL is changing <strong>one adapter</strong> —
          your business code doesn't change.
        </p>
      </Section>

      <Section title="Where the ids come from">
        <p>
          Each adapter generates the stored id for an insert and exposes it as a string{' '}
          <C>id</C> on the way out (Mongo's <C>_id</C> becomes <C>id</C>). Business code
          never sets an id — the input type forbids it — so you can't forge one or
          collide with another tenant.
        </p>
      </Section>

      <Section title="What can go wrong (and how the design protects you)">
        <Table
          head={['Mistake someone might make', 'What actually happens']}
          rows={[
            ['Forgetting to filter by tenant', 'Impossible — the guard always adds it'],
            ['Reading orgId from the request body', 'Not used; the tenant comes from the verified token'],
            ['Calling the DB with no tenant set', 'The base repository rejects (fails closed)'],
            ['Putting raw user text into SQL', 'Values are always bound as ? parameters'],
            ['Trying to set your own id/orgId on create', 'Stripped out before it reaches the DB'],
          ]}
        />
      </Section>

      <Section title="One-paragraph summary">
        <Callout kind="key">
          A request first proves who it is (token → claims → <C>orgId</C>). That{' '}
          <C>orgId</C> is parked on a per-request notepad. Your business code asks a
          repository for data <em>without</em> mentioning the tenant. A frozen base
          repository automatically stamps and filters by that <C>orgId</C> for every
          operation, then hands a neutral query to an engine adapter, which speaks
          MongoDB or SQL. The result is converted back to a clean object.{' '}
          <strong>Tenant isolation is automatic, central, and impossible to skip.</strong>
        </Callout>
      </Section>

      <NextSteps>
        <Card icon="🧠" title="The engine room" to="docs/internals">
          The same layers, opened up from the inside.
        </Card>
        <Card icon="�️" title="dal" to="about/dal">
          The query language + adapters, in detail.
        </Card>
      </NextSteps>

      <p className="contact">
        Questions? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
