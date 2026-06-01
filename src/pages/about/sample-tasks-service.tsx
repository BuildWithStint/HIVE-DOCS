import {
  Page,
  PageHeader,
  Section,
  Callout,
  CodeBlock,
  Table,
  Steps,
  Step,
  FileTree,
  C,
  DocLink,
  NextSteps,
  Card,
} from '../../components/ui';
import { Mermaid } from '../../components/Mermaid';

export const meta = {
  group: 'about',
  file: 'sample-tasks-service',
  title: 'Sample TASKS service',
  order: 11,
};

export default function SampleTasksService() {
  return (
    <Page>
      <PageHeader
        kicker="Concepts & Layers"
        title="Sample TASKS service — everything working together"
        lead="A small, runnable multi-tenant TASKS API under apps/tasks. It's the &quot;hello world&quot; of HIVE: it uses every layer, and its integration test makes real HTTP calls against a real MongoDB."
      />

      <Section title="What it demonstrates">
        <Table
          head={['Layer', 'How the sample uses it']}
          rows={[
            [<DocLink to="about/config">config</DocLink>, <>Reads <C>service.properties</C> + <C>env.local</C> (for <C>MONGO_URL</C>).</>],
            [<DocLink to="about/schema">schema</DocLink>, <>The <C>TASK</C> table is described once with <C>defineSchema</C> and compiled to a Mongoose model.</>],
            [<DocLink to="about/dal-mongoose">dal-mongoose</DocLink>, <><C>TaskRepository</C> extends <C>MongooseRepository</C> — no tenant code of its own.</>],
            [<>security + middleware</>, <><C>corePipeline</C> (requestContext → authenticate → tenant) protects every route and sets the tenant.</>],
            [<>tenant isolation</>, "org A cannot see or modify org B's tasks."],
          ]}
        />
        <Mermaid
          caption="The sample service stacks every layer end to end."
          chart={`
flowchart TD
    M["main.ts<br/><small>load config, connect Mongo, listen</small>"] --> APP["app.ts<br/><small>express.json → corePipeline → routes → errorHandler</small>"]
    APP --> ROUTES["routes.ts<br/><small>POST/GET/PATCH/DELETE /tasks</small>"]
    ROUTES --> REPO["TaskRepository"]
    REPO --> BASE["MongooseRepository (base)"]
    SCHEMA["task-schema.ts → task-model.ts"] --> REPO
`}
        />
      </Section>

      <Section title="How it's built (file by file)">
        <FileTree
          title="apps/tasks/"
          nodes={[
            { name: 'service.properties', note: 'constants (port, engine=mongo, counters)' },
            {
              name: 'src/lib/',
              children: [
                { name: 'schema/task-schema.ts', note: 'the TASK table (defineSchema)' },
                { name: 'model/task.ts', note: 'the Task TypeScript type' },
                { name: 'model/task-model.ts', note: 'builds a Mongoose model from the schema' },
                { name: 'repository/task-repository.ts', note: 'TaskRepository (+ id allocator)' },
                { name: 'http/token-verifier.ts', note: 'SAMPLE token verifier (demo only)' },
                { name: 'http/routes.ts', note: 'POST/GET/PATCH/DELETE /tasks' },
                { name: 'app.ts', note: 'composes the Express app' },
                { name: 'main.ts', note: 'boots: load config, connect Mongo, listen' },
                { name: 'tasks.integration.spec.ts', note: 'live test (skips if no MONGO_URL)' },
              ],
            },
          ]}
        />
      </Section>

      <Section title="How to run the tests (live MongoDB)">
        <Steps>
          <Step title="Add your Mongo URL to env.local at the repo root">
            <CodeBlock lang="properties" code={`MONGO_URL=mongodb+srv://USER:PASS@host/dbname`} />
          </Step>
          <Step title="Run the suite">
            <CodeBlock
              lang="bash"
              code={`export $(grep -v '^#' env.local | xargs)
npx nx test @hive/tasks`}
            />
          </Step>
        </Steps>
        <Callout kind="note">
          The suite skips automatically if <C>MONGO_URL</C> is not set.
        </Callout>
      </Section>

      <Section title="Try the API by hand (curl)">
        <p>The sample token is just base64url JSON (demo only). Build one and call the API:</p>
        <CodeBlock
          lang="bash"
          code={`# a token for org-A
TOKEN=$(node -e "process.stdout.write(Buffer.from(JSON.stringify({sub:'u1',orgId:'org-A'})).toString('base64url'))")

curl -X POST localhost:4010/tasks \\
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \\
  -d '{"title":"buy milk","priority":1}'

curl localhost:4010/tasks -H "Authorization: Bearer $TOKEN"`}
        />
      </Section>

      <Section title="How to extend it">
        <ul>
          <li>
            <strong>New field on tasks?</strong> Add it in <C>task-schema.ts</C> and{' '}
            <C>task.ts</C>.
          </li>
          <li>
            <strong>New endpoint?</strong> Add a route in <C>routes.ts</C> and call a
            repository method.
          </li>
          <li>
            <strong>Switch to SQL?</strong> Replace <C>TaskRepository</C>'s base with{' '}
            <C>SqlRepository</C> and provide a SQL executor — routes and the Task type stay
            the same.
          </li>
        </ul>
      </Section>

      <Section title="Important note">
        <Callout kind="danger">
          The <C>SampleTokenVerifier</C> is <strong>for local testing only</strong> (it
          doesn't check a signature). A real service injects a proper JWT verifier.
        </Callout>
      </Section>

      <NextSteps>
        <Card icon="🧩" title="How to add things" to="rules/how-to-add">
          Build your own service from this shape.
        </Card>
        <Card icon="🌊" title="How data flows" to="about/how-data-flows">
          Trace a request through this service.
        </Card>
      </NextSteps>

      <p className="contact">
        Questions? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
