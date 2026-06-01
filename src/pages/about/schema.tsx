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
  file: 'schema',
  title: 'schema',
  order: 3.5,
};

export default function Schema() {
  return (
    <Page>
      <PageHeader
        kicker="Layer · @hive/schema"
        title="schema — describe a table once, generate everything"
        lead="The Schema Definition Layer (SDL). Describe a table one time in a small, engine-neutral format and compile it to SQL, Mongoose, and TypeScript."
      />

      <Section title="Why it exists">
        <p>
          Without it, you'd write the same table three times (SQL, Mongo, TS) and they'd
          drift apart. With it, there is <strong>one source of truth</strong>, and
          naming/tenant rules are applied for you.
        </p>
        <Mermaid
          caption="One defineSchema() call compiles to three targets — they can never drift apart."
          chart={`
flowchart TD
    DS["defineSchema(...)<br/><small>one neutral definition</small>"] --> SQL["compileToSql<br/><small>CREATE TABLE + indexes</small>"]
    DS --> MON["compileToMongoose<br/><small>Mongoose definition</small>"]
    DS --> TS["compileToTypes<br/><small>TypeScript interface</small>"]
`}
        />
      </Section>

      <Section title="How it's built">
        <p>
          <C>defineSchema(&#123; name, scope, fields, indexes? &#125;)</C> validates and{' '}
          <strong>freezes</strong> a table definition. It fails closed on bad names,
          unknown types, duplicate fields, etc.
        </p>
        <Table
          head={['Rule', 'Detail']}
          rows={[
            ['Naming', <>Table names are <C>UPPER_SNAKE</C>. <strong>Common</strong> tables have no prefix (<C>USER</C>). <strong>Service</strong> tables get a prefix from their scope (<C>scope: 'billing'</C> + <C>INVOICE</C> → <C>BILLING_INVOICE</C>).</>],
            ['Field types', <>Neutral <C>type</C>: <C>string, int, bigint, bool, datetime, json, ref</C>, plus an optional <C>description</C>.</>],
            ['description', <><strong>Developer-only</strong>: NOT stored in the database; appears only as JSDoc on the generated TypeScript type.</>],
            ['Auto-injected', <>On every table: <C>id, orgId, createdAt, updatedAt, deletedAt</C>, and <C>orgId</C>-leading indexes. You never write these.</>],
          ]}
        />
        <Callout kind="key" title="The three compilers">
          <ul>
            <li>
              <C>compileToSql</C> / <C>compileToSqlStatements</C> — Postgres DDL
              (identifiers double-quoted; values never interpolated).
            </li>
            <li>
              <C>compileToMongoose</C> — neutral Mongoose definition (no mongoose
              dependency in this package).
            </li>
            <li>
              <C>compileToTypes</C> — a TypeScript interface extending <C>BaseEntity</C>.
            </li>
          </ul>
        </Callout>
      </Section>

      <Section title="How tables actually get created">
        <p>Compilers only produce text/objects. To apply them:</p>
        <ul>
          <li>
            <strong>SQL</strong>: <C>migrateSql(executor, [schemaA, schemaB])</C> runs{' '}
            <C>CREATE TABLE IF NOT EXISTS …</C> + indexes through an injected executor,
            inside a transaction (rolls back on failure). Idempotent — safe to re-run.
          </li>
          <li>
            <strong>Mongo</strong>: there is no "create table" — a collection appears on
            first insert. Use <C>mongoIndexCommands([...])</C> to get the{' '}
            <C>createIndex</C> calls.
          </li>
        </ul>
      </Section>

      <Section title="How to extend it">
        <ul>
          <li>
            <strong>New output target</strong> (e.g. JSON-Schema)? Add a new{' '}
            <C>compile/to-*.ts</C> file. Don't edit the existing compilers.
          </li>
          <li>
            <strong>New field type?</strong> Add it to the neutral <C>FieldType</C> and map
            it in each compiler.
          </li>
        </ul>
      </Section>

      <Section title="Gotchas">
        <Callout kind="warn">
          <C>description</C> must never be emitted to the database — only to TS docs.
          Service tables must carry their prefix (the helper makes this idempotent).
        </Callout>
        <CodeBlock
          lang="ts"
          code={`const TASK = defineSchema({
  name: 'TASK',
  scope: 'tasks',           // → physical name TASKS_TASK
  fields: [
    { name: 'title', type: 'string', description: 'Short summary' },
    { name: 'done',  type: 'bool' },
  ],
});`}
        />
      </Section>

      <NextSteps>
        <Card icon="🧩" title="models-common" to="about/models-common">
          Shared entities and tenant-safe indexes.
        </Card>
        <Card icon="🐘" title="dal-sql" to="about/dal-sql">
          Run the generated DDL with the migrator.
        </Card>
      </NextSteps>

      <p className="contact">
        Questions? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
