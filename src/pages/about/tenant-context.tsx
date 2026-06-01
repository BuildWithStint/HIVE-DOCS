import {
  Page,
  PageHeader,
  Section,
  Callout,
  CodeBlock,
  Table,
  C,
  NextSteps,
  Card,
} from '../../components/ui';
import { Mermaid } from '../../components/Mermaid';

export const meta = {
  group: 'about',
  file: 'tenant-context',
  title: 'tenant-context',
  order: 10,
};

export default function TenantContext() {
  return (
    <Page>
      <PageHeader
        kicker="Layer · @hive/tenant-context"
        title="tenant-context — who is this request for?"
        lead="A tiny library that remembers the current tenant (orgId, and optionally userId / requestId) for the duration of one request — without you passing it around by hand."
      />

      <Section title="Why it exists">
        <p>
          Every database query needs to know "which org?". Threading an <C>orgId</C>{' '}
          argument through every function would be error-prone (forget once = data
          leak). Instead we store it in Node's <strong>AsyncLocalStorage</strong>, which
          keeps a value available to all code running inside a request, even across{' '}
          <C>await</C>s.
        </p>
        <Mermaid
          caption="The orgId is set once at the edge and is readable everywhere downstream, automatically."
          chart={`
flowchart LR
    MW["tenant middleware"] -->|runWithTenant| ALS[("AsyncLocalStorage<br/>orgId = org-A")]
    ALS -.-> R["route"]
    ALS -.-> S["service"]
    ALS -.-> Repo["repository → getOrgIdOrThrow()"]
`}
        />
      </Section>

      <Section title="How it's built">
        <Table
          head={['API', 'What it does']}
          rows={[
            [<C>runWithTenant(scope, callback)</C>, 'Runs callback with a tenant scope active.'],
            [<C>getTenantScope()</C>, 'Returns the current scope (or undefined).'],
            [<C>getOrgIdOrThrow()</C>, <>Returns the current <C>orgId</C>, or <strong>throws</strong> if there isn't one. The fail-closed gate the data layer relies on.</>],
            [<C>MissingTenantContextError</C>, 'The error thrown when no tenant is active.'],
          ]}
        />
        <Callout kind="note">
          There is exactly <strong>one</strong> shared <C>AsyncLocalStorage</C> instance,
          so the whole app agrees on "the current tenant".
        </Callout>
      </Section>

      <Section title="How to use it">
        <p>You normally don't call this directly — the tenant middleware does:</p>
        <CodeBlock
          lang="ts"
          code={`runWithTenant({ orgId: 'org-123', userId: 'u1' }, () => next());`}
        />
        <p>
          Inside that callback (and anything it calls), <C>getOrgIdOrThrow()</C> returns{' '}
          <C>'org-123'</C>.
        </p>
      </Section>

      <Section title="How to extend it">
        <ul>
          <li>
            Need another per-request value (e.g. a locale)? Add an{' '}
            <strong>optional</strong> field to <C>TenantScope</C>. Keep <C>orgId</C>{' '}
            required.
          </li>
          <li>
            Do <strong>not</strong> add a way to read the scope that returns a
            default/guess — the whole point is that a missing tenant fails loudly.
          </li>
        </ul>
      </Section>

      <Section title="Gotchas">
        <Callout kind="warn">
          If you start work <strong>outside</strong> <C>runWithTenant</C> (e.g. a cron
          job), there is no tenant — you must wrap it yourself.
        </Callout>
      </Section>

      <NextSteps>
        <Card icon="🧱" title="dal-core" to="about/dal-core">
          The frozen core that reads this notepad.
        </Card>
        <Card icon="🌊" title="How data flows" to="about/how-data-flows">
          See the notepad in the full request journey.
        </Card>
      </NextSteps>

      <p className="contact">
        Questions? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
