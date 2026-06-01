import { Page, PageHeader, Section, Cards, Card, Callout, DocLink } from '../../components/ui';

export const meta = {
  group: 'docs',
  file: 'index',
  title: 'Setup & Reference',
  order: 0,
};

export default function DocsOverview() {
  return (
    <Page>
      <PageHeader
        kicker="Setup & Reference"
        title="Setup & Reference"
        lead="Practical, hands-on docs: how to set the project up, what every command does, how each layer works inside, and how to test the databases."
      />

      <Section title="Start here">
        <Cards cols={2}>
          <Card icon="🚀" title="Getting started" to="docs/getting-started">
            From a fresh clone to a running service and these docs, step by step.
          </Card>
          <Card icon="⌨️" title="Command reference" to="docs/commands">
            Every command explained — pnpm, Nx, the portal, the sample service,
            and test helpers.
          </Card>
          <Card icon="🧠" title="How every layer works internally" to="docs/internals">
            The engine-room tour of each package: the classes, the data, and the
            design choices.
          </Card>
          <Card icon="🐘" title="Testing with Postgres" to="docs/testing-postgres">
            Run the SQL path against a real Postgres engine (no install needed),
            plus Docker and hosted options.
          </Card>
        </Cards>
      </Section>

      <Callout kind="note" title="Looking for concepts instead of setup?">
        Per-layer guides live under <DocLink to="about">Concepts &amp; Layers</DocLink>.
        The rules for writing code live under <DocLink to="rules">Rules</DocLink>.
      </Callout>

      <p className="contact">
        Questions? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
