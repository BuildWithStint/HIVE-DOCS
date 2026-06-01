import {
  Page,
  PageHeader,
  Section,
  Callout,
  Table,
  Cards,
  Card,
  Term,
  C,
  DocLink,
} from '../../components/ui';
import { Mermaid } from '../../components/Mermaid';

export const meta = {
  group: 'about',
  file: 'index',
  title: 'Concepts & Layers',
  order: 0,
};

export default function AboutOverview() {
  return (
    <Page>
      <PageHeader
        kicker="Concepts & Layers"
        title="About HIVE — plain-English guides"
        lead="HIVE (Hosted Isolated Virtual Environments) is a multi-tenant backend platform. These guides explain what each part does, how it's built, and how to extend it — written so a brand-new joiner can follow along. No prior knowledge of the codebase is assumed."
      />

      <Callout kind="tip" title="In a hurry?">
        Start with the <DocLink to="about/faq">FAQ</DocLink>, or read the two deep
        dives below.
      </Callout>

      <Section title="The big idea (read this first)">
        <p>
          HIVE is a <strong>multi-tenant</strong> platform: many organizations
          ("tenants") share the same running service and the same database, but{' '}
          <strong>no tenant can ever see another tenant's data</strong>. Every row
          carries an <C>orgId</C>, and the platform automatically filters every query
          by the current tenant.
        </p>
        <p>
          The trick that makes this safe: tenant isolation is written{' '}
          <strong>once</strong>, in a "frozen core", and <strong>every</strong>{' '}
          database call goes through it. A developer writing a feature cannot
          accidentally skip the check.
        </p>
        <Mermaid
          caption="Every request sets the current orgId, then the frozen core adds the tenant filter to every database call — automatically."
          chart={`
flowchart TD
    REQ([HTTP request]) --> MW["middleware<br/><small>authenticate → set current orgId</small>"]
    MW --> ROUTES["your routes<br/><small>normal business code</small>"]
    ROUTES --> CORE["dal-core frozen base<br/><small>adds orgId filter — always</small>"]
    CORE --> ADP["dal-mongoose / dal-sql<br/><small>talks to Mongo / SQL</small>"]
    ADP --> DB[("one shared DB<br/>rows tagged by orgId")]
`}
        />
      </Section>

      <Section title="What the names mean (HIVE &amp; MINT)">
        <p>
          The two names are small backronyms — and the imagery is deliberate: a hive is
          made of <strong>many separate cells in one shared structure</strong>, just like
          many tenants in one platform; the services are the <strong>bees</strong>.
        </p>
        <Table
          head={['Name', 'Stands for', 'In one line']}
          rows={[
            [<strong>HIVE</strong>, <strong>Hosted Isolated Virtual Environments</strong>, 'The multi-tenant backend platform. Many cells, one structure; services = bees.'],
            [<strong>MINT</strong>, <strong>Module Isolation from Nx Toolkit</strong>, <>The private tool that mints a shippable, isolated copy of a service. See <DocLink to="about/mint">MINT</DocLink>.</>],
          ]}
        />
      </Section>

      <Section title="The two deep dives">
        <Cards cols={2}>
          <Card icon="🌊" title="How data flows" to="about/how-data-flows">
            Exactly how a request talks to the database, step by step — tenant
            isolation, the neutral query language, ids. With an apartment-building
            analogy.
          </Card>
          <Card icon="🪄" title="How MINT works" to="about/how-mint-works">
            How the MINT tool works and what "extract" means — told as a simple
            story plus the real 9-step pipeline.
          </Card>
        </Cards>
      </Section>

      <Section title="Layer map">
        <Table
          head={['Layer', 'Package', 'Guide']}
          rows={[
            ['Tenant scope', <C>@hive/tenant-context</C>, <DocLink to="about/tenant-context">tenant-context</DocLink>],
            ['Data contract + core', <C>@hive/dal-core</C>, <DocLink to="about/dal-core">dal-core</DocLink>],
            ['MongoDB adapter', <C>@hive/dal-mongoose</C>, <DocLink to="about/dal-mongoose">dal-mongoose</DocLink>],
            ['SQL adapter', <C>@hive/dal-sql</C>, <DocLink to="about/dal-sql">dal-sql</DocLink>],
            ['Shared models', <C>@hive/models-common</C>, <DocLink to="about/models-common">models-common</DocLink>],
            ['Schema layer', <C>@hive/schema</C>, <DocLink to="about/schema">schema</DocLink>],
            ['Config', <C>@hive/config</C>, <DocLink to="about/config">config</DocLink>],
            ['Auth', <C>@hive/security</C>, <DocLink to="about/security">security</DocLink>],
            ['HTTP pipeline', <C>@hive/middleware</C>, <DocLink to="about/middleware">middleware</DocLink>],
            ['Logging/metrics', <C>@hive/observability</C>, <DocLink to="about/observability">observability</DocLink>],
            ['Sample app', <C>apps/tasks</C>, <DocLink to="about/sample-tasks-service">sample-tasks-service</DocLink>],
            ['Docs portal', <C>@hive/portal</C>, <DocLink to="about/devportal">devportal</DocLink>],
            ['Extraction tool', <C>MINT</C>, <DocLink to="about/mint">mint</DocLink>],
          ]}
        />
      </Section>

      <Section title="A few words that show up everywhere">
        <Term word="Tenant / org">A customer organization. Identified by <C>orgId</C>.</Term>
        <Term word="Fail closed">
          When something is missing (no tenant, bad token), the code{' '}
          <strong>refuses</strong> instead of guessing — the safe default.
        </Term>
        <Term word="Engine-neutral">
          Written without Mongo- or SQL-specific syntax, so it works on either.
        </Term>
        <Term word="Injected (Dependency Inversion)">
          The platform defines an interface; the service plugs in the real thing (a
          logger, a token verifier, a DB driver).
        </Term>
      </Section>

      <p className="contact">
        Questions about any of this? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
