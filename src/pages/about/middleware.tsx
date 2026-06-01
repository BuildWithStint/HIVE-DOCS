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
  NextSteps,
  Card,
} from '../../components/ui';
import { Mermaid } from '../../components/Mermaid';

export const meta = {
  group: 'about',
  file: 'middleware',
  title: 'middleware',
  order: 7,
};

export default function Middleware() {
  return (
    <Page>
      <PageHeader
        kicker="Layer · @hive/middleware"
        title="middleware — the request pipeline"
        lead="The ordered set of Express middlewares every request flows through, plus a ready-made corePipeline that wires the mandatory ones in the correct order."
      />

      <Section title="Why it exists">
        <p>
          Some steps <strong>must</strong> happen in a fixed order (you can't query the
          database before the tenant is set). Bundling them into one pipeline means a
          service can't get the order wrong.
        </p>
        <Mermaid
          caption="Tier 1 is fixed and mandatory. Your routes (Tier 2) come after. The error handler is always last."
          chart={`
flowchart LR
    J["express.json()"] --> RC["requestContext()"]
    RC --> AU["authenticate(verifier)"]
    AU --> TM["tenantMiddleware()"]
    TM -. "Tier 1 (fixed)" .- TM
    TM --> R["your routes<br/><small>Tier 2</small>"]
    R --> EH["errorHandler()<br/><small>always last</small>"]
`}
        />
      </Section>

      <Section title="How it's built">
        <Table
          head={['Piece', 'What it does']}
          rows={[
            [<C>requestContext()</C>, <>Assigns a <C>requestId</C> (honors an inbound <C>X-Request-Id</C>, else generates one) and echoes it back. Used to correlate logs.</>],
            [<C>tenantMiddleware()</C>, <>Reads <C>orgId</C> from the verified claims (<C>req.auth</C>) and runs the rest of the request inside <C>runWithTenant(...)</C>. No <C>orgId</C> → 401 (fail closed).</>],
            [<C>errorHandler()</C>, <>The <strong>last</strong> middleware. Turns <C>HttpError</C>s into <C>status + message</C>; anything else becomes a generic 500 (no internal details leak). Echoes the <C>requestId</C>.</>],
            [<C>corePipeline(&#123; verifier &#125;)</C>, <><strong>Tier 1</strong>, fixed order: <C>requestContext → authenticate(verifier) → tenantMiddleware</C>.</>],
          ]}
        />
      </Section>

      <Section title="How to use it">
        <CodeBlock
          lang="ts"
          code={`app.use(express.json());
app.use(...corePipeline({ verifier }));  // Tier 1 (fixed)
app.use(myRoutes);                        // Tier 2 (your routes)
app.use(errorHandler());                  // always last`}
        />
        <Steps>
          <Step title="Parse the body">
            <C>express.json()</C> first so handlers see <C>req.body</C>.
          </Step>
          <Step title="Run Tier 1">
            <C>corePipeline</C> establishes request id, identity, and tenant — in that
            fixed order.
          </Step>
          <Step title="Your routes (Tier 2)">
            Rate-limit, body validation, caching, and your handlers go here, in any order
            you need.
          </Step>
          <Step title="Error handler last">
            <C>errorHandler()</C> formats every thrown error into a clean response.
          </Step>
        </Steps>
      </Section>

      <Section title="How to extend it">
        <ul>
          <li>
            <strong>Add a Tier-2 middleware</strong>: write a small function returning a{' '}
            <C>RequestHandler</C>; register it after <C>corePipeline</C> and before{' '}
            <C>errorHandler</C>.
          </li>
          <li>
            <strong>Don't reorder Tier 1</strong> — the order is a safety guarantee.
          </li>
        </ul>
      </Section>

      <Section title="Gotchas">
        <Callout kind="warn">
          Register <C>errorHandler()</C> <strong>last</strong>, after routes. The tenant
          scope is active for code that runs <em>inside</em> the request chain; don't
          "await between handlers" in a way that resumes outside it.
        </Callout>
      </Section>

      <NextSteps>
        <Card icon="🔐" title="security" to="about/security">
          The authenticate / authorize building blocks.
        </Card>
        <Card icon="🪪" title="tenant-context" to="about/tenant-context">
          Where tenantMiddleware parks the orgId.
        </Card>
      </NextSteps>

      <p className="contact">
        Questions? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
