import {
  Page,
  PageHeader,
  Section,
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
  group: 'about',
  file: 'dal-sql',
  title: 'dal-sql',
  order: 6,
};

export default function DalSql() {
  return (
    <Page>
      <PageHeader
        kicker="Layer · @hive/dal-sql"
        title="dal-sql — the SQL adapter"
        lead="The piece that makes the neutral data layer talk to a SQL database (PostgreSQL-style). It proves the &quot;swap the engine&quot; promise: same business code, different database."
      />

      <Section title="Why it exists">
        <p>
          To show (and enable) that a service can move from MongoDB to SQL by changing{' '}
          <strong>only the adapter</strong> — <DocLink to="about/dal-core">dal-core</DocLink>,
          routes, and models stay the same.
        </p>
        <Mermaid
          caption="Same neutral query; the SQL adapter binds every value as a parameter and allow-lists identifiers."
          chart={`
flowchart LR
    QS["QuerySpec"] --> SQ["sql-query.ts"]
    SQ --> P["parameterized SQL<br/><small>values → ?, identifiers allow-listed</small>"]
    P --> EX["SqlExecutor<br/><small>injected: pg / mysql2 / knex</small>"]
    EX --> DB[("SQL database")]
`}
        />
      </Section>

      <Section title="How it's built">
        <Table
          head={['Piece', 'What it is']}
          rows={[
            [<C>SqlRepository&lt;T&gt;</C>, <>Extends <C>AbstractBaseRepository</C> and implements the five <C>execute*</C> hooks by building <strong>parameterized</strong> SQL. No tenant logic — the base added it.</>],
            [<C>sql-query.ts</C>, <>Translates <C>QuerySpec</C> → SQL. See the safety rules below.</>],
            [<C>SqlExecutor</C>, <>An <strong>injected</strong> interface (<C>query</C> / <C>execute</C>). We don't hard-code a driver; a service provides one backed by <C>pg</C>, <C>mysql2</C>, Knex, etc.</>],
            [<C>SqlCounterAllocator</C>, <>Sequential ids via a <C>counters</C> table (so id behavior matches Mongo and survives a migration).</>],
          ]}
        />
        <Callout kind="key" title="Injection-safety rules in sql-query.ts">
          <ul>
            <li>
              <strong>values</strong> are always bound as <C>?</C> parameters (no string
              concatenation) → prevents SQL injection,
            </li>
            <li>
              <strong>identifiers</strong> (table/column names) are checked against an
              allow-list before use,
            </li>
            <li>
              <C>contains</C> becomes <C>LIKE ? ESCAPE '\\'</C> with wildcards escaped,
            </li>
            <li>
              empty <C>IN ()</C> becomes <C>1 = 0</C> (matches nothing, valid SQL).
            </li>
          </ul>
        </Callout>
      </Section>

      <Section title="How to use it">
        <CodeBlock
          lang="ts"
          code={`const repo = new SqlRepository<User>(executor, 'USER', allocator, 'user');`}
        />
        <p>
          The <C>executor</C> is whatever you wrote to run SQL against your real database.
        </p>
      </Section>

      <Section title="How to extend it">
        <ul>
          <li>
            <strong>New entity?</strong> <C>new SqlRepository(...)</C> or subclass it for
            custom finders.
          </li>
          <li>
            <strong>Different SQL dialect / placeholder style?</strong> Wrap your driver in
            an <C>SqlExecutor</C> that rewrites placeholders (e.g. <C>?</C> → <C>$1</C> for
            Postgres).
          </li>
        </ul>
      </Section>

      <Section title="Gotchas">
        <Callout kind="warn">
          Placeholders are positional <C>?</C> (MySQL/SQLite style); adapt for Postgres in
          the executor. Unlike Mongo, SQL's primary key is already <C>id</C> — no{' '}
          <C>id</C>/<C>_id</C> mapping. To create the tables, use the schema layer's
          migrator (see <DocLink to="about/schema">schema</DocLink>).
        </Callout>
        <Callout kind="tip" title="This path is verified live">
          <C>verify-postgres.mjs</C> runs the full SQL path against a real Postgres engine
          in-process (PGlite). See <DocLink to="docs/testing-postgres">testing with Postgres</DocLink>.
        </Callout>
      </Section>

      <NextSteps>
        <Card icon="🍃" title="dal-mongoose" to="about/dal-mongoose">
          The Mongo counterpart.
        </Card>
        <Card icon="🧬" title="schema" to="about/schema">
          Generate the tables and indexes.
        </Card>
      </NextSteps>

      <p className="contact">
        Questions? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
