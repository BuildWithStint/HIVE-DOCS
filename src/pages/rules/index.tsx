import {
  Page,
  PageHeader,
  Section,
  Callout,
  Cards,
  Card,
  C,
  DocLink,
} from '../../components/ui';

export const meta = {
  group: 'rules',
  file: 'index',
  title: 'Rules overview',
  order: 0,
};

export default function RulesIndex() {
  return (
    <Page>
      <PageHeader
        kicker="Rules"
        title="HIVE rules"
        lead="Read these before writing code. They keep the platform safe (multi-tenant), portable (Mongo ↔ SQL), and consistent."
      />

      <Section title="The three rule pages">
        <Cards cols={3}>
          <Card icon="✍️" title="Coding standards" to="rules/coding-standards">
            How to write code here: modules, SOLID, tenant safety, security, tests.
          </Card>
          <Card icon="🧩" title="How to add things" to="rules/how-to-add">
            Exactly where to put a model, entity, endpoint, service, engine, or config.
          </Card>
          <Card icon="📦" title="MINT rules" to="rules/mint">
            What you may and may not touch in the extraction tool.
          </Card>
        </Cards>
      </Section>

      <Section title="The non-negotiables (summary)">
        <ol>
          <li>
            <strong>Never bypass the data layer.</strong> All reads/writes go through a
            repository that extends <C>AbstractBaseRepository</C>. No raw DB calls in
            services.
          </li>
          <li>
            <strong>Never trust client input for identity.</strong> <C>orgId</C> and{' '}
            <C>sub</C> come only from a verified token, never headers/body.
          </li>
          <li>
            <strong>Stay engine-neutral in business code.</strong> Use <C>QuerySpec</C>; no{' '}
            <C>$gte</C>, no <C>WHERE</C>.
          </li>
          <li>
            <strong>Fail closed.</strong> Missing tenant, bad token, unknown engine, missing
            required config → refuse, don't guess.
          </li>
          <li>
            <strong>No secrets in git.</strong> Secrets live in <C>env.local</C>{' '}
            (gitignored).
          </li>
          <li>
            <strong>Every package keeps its docs current</strong>: <C>AGENTS.md</C>,{' '}
            <C>CONTEXT.md</C>, <C>.instructions.md</C>, and a plain-English guide in{' '}
            <C>about/</C>.
          </li>
          <li>
            <strong>Keep <C>about/</C>, <C>rules/</C>, and the FAQ in sync with every
            change.</strong> If a change affects MINT or another module, update the matching{' '}
            <DocLink to="about">about</DocLink> page, the relevant rules page, and add a{' '}
            <DocLink to="about/faq">FAQ</DocLink> entry if it raises a common question.
          </li>
        </ol>
      </Section>

      <Callout kind="tip" title="Write it simply">
        Assume the reader is brand new. Prefer plain words and a small analogy over jargon.
        Long is fine; confusing is not.
      </Callout>

      <p className="contact">
        Questions? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
