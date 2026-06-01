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
  file: 'dal-mongoose',
  title: 'dal-mongoose',
  order: 5,
};

export default function DalMongoose() {
  return (
    <Page>
      <PageHeader
        kicker="Layer · @hive/dal-mongoose"
        title="dal-mongoose — the MongoDB adapter"
        lead="The piece that makes the neutral data layer talk to MongoDB (via Mongoose)."
      />

      <Section title="Why it exists">
        <p>
          <DocLink to="about/dal-core">dal-core</DocLink> is engine-neutral on purpose.
          Something has to translate a neutral <C>QuerySpec</C> into Mongo queries and
          turn Mongo documents back into plain domain objects. That's this adapter.
        </p>
        <Mermaid
          caption="The adapter is pure translation: neutral query in, Mongo out; Mongo doc in, clean domain object out."
          chart={`
flowchart LR
    QS["QuerySpec<br/><small>neutral</small>"] --> Q["mongoose-query.ts"]
    Q --> MQ["Mongo filter / sort"]
    MQ --> DB[("MongoDB")]
    DB --> D["to-domain.ts"]
    D --> OBJ["clean object<br/><small>id, no __v</small>"]
`}
        />
      </Section>

      <Section title="How it's built">
        <Table
          head={['Piece', 'What it is']}
          rows={[
            [<C>MongooseRepository&lt;T&gt;</C>, <>Extends <C>AbstractBaseRepository</C> and implements the five <C>execute*</C> hooks using Mongoose calls. <strong>No tenant logic</strong> — the base merged the <C>orgId</C> filter.</>],
            [<C>mongoose-query.ts</C>, <>Translates <C>QuerySpec</C> → Mongo filter/sort. <C>contains</C> becomes a <strong>safe</strong> case-insensitive regex (special chars escaped, so user input can't inject a regex).</>],
            [<C>to-domain.ts</C>, <>Turns a Mongo doc (<C>_id</C>, <C>__v</C>, …) into a clean domain object (<C>id</C>, no <C>__v</C>).</>],
            [<><C>CounterStore</C> / <C>MongoCounterStore</C></>, <>An atomic counter in a <C>counters</C> collection.</>],
            [<C>CounterAllocator</C>, 'Gap-free, one increment per insert (the version shipped to clients via MINT).'],
            [<C>RangeReservationAllocator</C>, 'Reserves blocks of ids for speed (HIVE-internal secret sauce).'],
            [<C>MongoModel</C>, 'A small structural interface describing only the Mongoose methods we use, so the adapter is easy to unit-test with a fake.'],
          ]}
        />
        <Callout kind="note">
          Sequential BIGINT ids are used even though Mongo loves random ids — so id
          behavior matches SQL and survives a migration.
        </Callout>
      </Section>

      <Section title="How to use it">
        <p>A service builds a real Mongoose model and passes it in:</p>
        <CodeBlock
          lang="ts"
          code={`const repo = new MongooseRepository<Task>(model, allocator, 'task');`}
        />
        <p>
          (See <DocLink to="about/sample-tasks-service">apps/tasks</DocLink> for a
          full example, including building the model from the schema layer.)
        </p>
      </Section>

      <Section title="How to extend it">
        <ul>
          <li>
            <strong>Custom finders</strong>? Subclass <C>MongooseRepository</C> and add
            methods that build a <C>QuerySpec</C> and call the inherited methods.
          </li>
          <li>
            <strong>Different id strategy?</strong> Implement <C>IdAllocator</C> and inject
            it.
          </li>
        </ul>
      </Section>

      <Section title="Gotchas">
        <Callout kind="warn">
          Sequential ids are stored as Mongo <C>_id</C>; <C>to-domain</C> maps <C>_id</C> →{' '}
          <C>id</C>. Never read the tenant yourself — let the base do it.
        </Callout>
      </Section>

      <NextSteps>
        <Card icon="🐘" title="dal-sql" to="about/dal-sql">
          The SQL counterpart.
        </Card>
        <Card icon="🧱" title="dal-core" to="about/dal-core">
          The frozen base this extends.
        </Card>
      </NextSteps>

      <p className="contact">
        Questions? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
