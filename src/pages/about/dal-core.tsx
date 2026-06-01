import {
  Page,
  PageHeader,
  Section,
  Callout,
  Table,
  C,
  DocLink,
  NextSteps,
  Card,
} from '../../components/ui';
import { Mermaid } from '../../components/Mermaid';

export const meta = {
  group: 'about',
  file: 'dal-core',
  title: 'dal-core',
  order: 4,
};

export default function DalCore() {
  return (
    <Page>
      <PageHeader
        kicker="Layer · @hive/dal-core"
        title="dal-core — the data contract + the frozen core"
        lead={
          <>
            The heart of HIVE's data layer. Want the long, step-by-step walkthrough with
            analogies? Read <DocLink to="about/how-data-flows">how data flows</DocLink>.
            This page is the focused reference.
          </>
        }
      />

      <Section title="What it is">
        <p>It defines two things:</p>
        <ol>
          <li>a <strong>neutral query language</strong> (no Mongo/SQL syntax), and</li>
          <li>
            a <strong>base repository</strong> that enforces tenant isolation for every
            engine.
          </li>
        </ol>
      </Section>

      <Section title="Why it exists">
        <p>
          We want to write business code once and run it on MongoDB or SQL. So business
          code must never contain <C>$gte</C> (Mongo) or <C>WHERE</C> (SQL). It describes{' '}
          <em>intent</em> with neutral types; each engine adapter translates that into its
          own syntax. And we want tenant isolation to be impossible to skip — so it lives
          here, in a base class every repository extends.
        </p>
        <Mermaid
          caption="Business code speaks neutral; the frozen base stamps the tenant; adapters translate per engine."
          chart={`
flowchart TD
    BC["Business code<br/><small>neutral QuerySpec</small>"] --> BASE["AbstractBaseRepository<br/><small>FROZEN: injects orgId, strips ids, allocates ids</small>"]
    BASE --> M["Mongo adapter<br/>execute*()"]
    BASE --> S["SQL adapter<br/>execute*()"]
    M --> DB1[("MongoDB")]
    S --> DB2[("Postgres")]
`}
        />
      </Section>

      <Section title="How it's built">
        <Table
          head={['Piece', 'What it is']}
          rows={[
            [<C>Entity</C>, <>Every stored thing has <C>&#123; id: number; orgId: string &#125;</C>.</>],
            [<C>QuerySpec</C>, <>A small declarative query: <C>where</C>, <C>sort</C>, <C>limit</C>, <C>offset</C>. Operators only the ones every engine supports (<C>eq, ne, gt, gte, lt, lte, in, contains</C>).</>],
            [<><C>CreateInput</C> / <C>UpdateInput</C></>, <>What a caller may send. They <strong>exclude managed fields</strong> (<C>id, orgId, createdAt, updatedAt, deletedAt</C>) so you can't forge an id, switch tenants, or fake audit timestamps.</>],
            [<C>IRepository&lt;T&gt;</C>, <>The contract: <C>findById, findOne, findMany, create, update, delete, count</C>.</>],
            [<C>AbstractBaseRepository</C>, 'The frozen core (see below).'],
            [<C>IdAllocator</C>, 'The strategy for generating sequential ids.'],
            [<C>RepositoryFactory</C>, "Picks the right adapter for a service's chosen engine."],
          ]}
        />
        <Callout kind="key" title="What the frozen base always does">
          <ul>
            <li>
              reads <C>orgId</C> from tenant-context and merges it into every query (and
              throws if there's no tenant),
            </li>
            <li>strips <C>id</C>/<C>_id</C>/<C>orgId</C> from incoming payloads,</li>
            <li>allocates ids centrally via an injected <C>IdAllocator</C>,</li>
            <li>
              calls small <C>execute*</C> methods that the engine adapter fills in.
            </li>
          </ul>
        </Callout>
      </Section>

      <Section title="How to extend it">
        <ul>
          <li>
            <strong>New engine?</strong> Create an adapter that extends{' '}
            <C>AbstractBaseRepository</C> and implements the five <C>execute*</C> methods.
            Do <strong>not</strong> put tenant logic there — the base already did it.
          </li>
          <li>
            <strong>New query ability?</strong> Only add an operator to <C>QuerySpec</C>{' '}
            if <strong>every</strong> engine can support it. Engine-only features must not
            leak in.
          </li>
        </ul>
      </Section>

      <Section title="Gotchas">
        <Callout kind="warn">
          All tenant-checking methods are <C>async</C> and <strong>reject</strong> (not
          throw synchronously) when there's no tenant. Never bypass the base by writing
          raw DB calls in a service.
        </Callout>
      </Section>

      <NextSteps>
        <Card icon="🍃" title="dal-mongoose" to="about/dal-mongoose">
          The MongoDB adapter.
        </Card>
        <Card icon="🐘" title="dal-sql" to="about/dal-sql">
          The SQL adapter.
        </Card>
        <Card icon="🌊" title="How data flows" to="about/how-data-flows">
          The full request journey.
        </Card>
      </NextSteps>

      <p className="contact">
        Questions? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
