import {
  Page,
  PageHeader,
  Section,
  Callout,
  CodeBlock,
  Steps,
  Step,
  C,
  DocLink,
  NextSteps,
  Card,
} from '../../components/ui';
import { Mermaid } from '../../components/Mermaid';

export const meta = {
  group: 'rules',
  file: 'how-to-add',
  title: 'How to add things',
  order: 2,
};

export default function HowToAdd() {
  return (
    <Page>
      <PageHeader
        kicker="Rules"
        title="How to add things (where to put what)"
        lead="A practical checklist for the most common changes. Follow the order shown."
      />

      <Callout kind="warn" title="After adding a workspace:* dependency">
        Run <C>pnpm install</C> <strong>then</strong> <C>npx nx sync</C> before building.
        Otherwise you get <C>TS2307: Cannot find module '@hive/...'</C>.
      </Callout>

      <Section title="Add a new platform package (library)">
        <Steps>
          <Step title="Generate it">
            <CodeBlock
              lang="bash"
              code={`npx nx g @nx/js:library <name> --directory=packages/<name> \\
  --bundler=tsc --unitTestRunner=jest --no-interactive`}
            />
          </Step>
          <Step title="Delete the generated stub">
            Remove the generated <C>*.ts</C> / <C>*.spec.ts</C> stubs.
          </Step>
          <Step title="Add workspace deps">
            Add <C>"@hive/x": "workspace:*"</C> to its <C>package.json</C>, then{' '}
            <C>pnpm install</C> &amp;&amp; <C>npx nx sync</C>.
          </Step>
          <Step title="Write code">
            Under <C>src/lib/</C>, export from <C>src/index.ts</C>.
          </Step>
          <Step title="Add tests + docs">
            Add tests, plus <C>AGENTS.md</C>, <C>CONTEXT.md</C>, <C>.instructions.md</C>, and{' '}
            <C>about/&lt;name&gt;.md</C>.
          </Step>
          <Step title="Verify">
            <CodeBlock lang="bash" code={`npx nx run-many -t typecheck test -p @hive/<name>`} />
          </Step>
        </Steps>
      </Section>

      <Section title="Add a new entity">
        <ol>
          <li>
            Pick a stable <C>entity</C> name (the Mongo collection or Postgres table),
            e.g. <C>products</C>. The engine-neutral{' '}
            <DocLink to="about/dal">@hive/dal</DocLink> query references it by that name.
          </li>
          <li>
            Don't model <C>id</C> or <C>orgId</C> by hand — the adapter generates the id
            and (in the pooled build) the tenant provider stamps <C>orgId</C>.
          </li>
          <li>
            Build queries with the <C>where(field, op, value)</C> helper and the
            friendly <C>FetchQuery</C> / <C>WriteQuery</C> shapes from <C>@hive/dal</C>.
          </li>
        </ol>
      </Section>

      <Section title="Add a new endpoint to a service">
        <ol>
          <li>
            Add a route in the service's <C>routes.ts</C>. Validate input at the top (throw{' '}
            <C>HttpError(400, ...)</C> on bad input).
          </li>
          <li>Call a <strong>repository</strong> method — never the database directly.</li>
          <li>Wrap async handlers so errors reach <C>next(err)</C>.</li>
          <li>
            The tenant is already set by <C>corePipeline</C>; every repo call is auto-scoped.
          </li>
        </ol>
      </Section>

      <Section title="Add a new service (app)">
        <Mermaid
          caption="Wire a new service exactly like apps/demo."
          chart={`
flowchart LR
    DAL["@hive/dal"] --> MR["make-repository"]
    MR --> APP["app.ts:<br/>json → corePipeline → routes → errorHandler"]
    APP --> MAIN["main.ts: set HIVE_SERVICE_DIR → listen"]
`}
        />
        <ol>
          <li>Create a package under <C>apps/&lt;name&gt;</C>.</li>
          <li>Add <C>@hive/connection</C> + <C>@hive/dal</C> as <C>workspace:*</C> deps.</li>
          <li>
            Wire it up like <DocLink to="about/demo-service">apps/demo</DocLink>: a
            single <C>make-repository.ts</C> (db type + tenancy), an <C>app.ts</C>{' '}
            (<C>express.json()</C> → <C>corePipeline</C> → routes → <C>errorHandler()</C>),
            and a <C>main.ts</C> that sets <C>HIVE_SERVICE_DIR</C> and listens.
          </li>
          <li>Tenancy lives in <C>src/lib/tenancy</C> (AsyncLocalStorage).</li>
        </ol>
        <Callout kind="note">
          Docs are <strong>not</strong> served from inside services. Read them with the
          standalone <DocLink to="about/devportal">docs portal</DocLink>: <C>pnpm hive</C>.
        </Callout>
      </Section>

      <Section title="Add support for a new database engine">
        <ol>
          <li>
            Add an adapter in <C>packages/dal/src/adapters</C> that implements{' '}
            <C>DatabaseAdapter</C> (one method: <C>execute(spec)</C>). Put{' '}
            <strong>no tenant logic</strong> there — the Repository injects it.
          </li>
          <li>
            Translate the neutral <C>QuerySpec</C> to engine syntax with the same safety
            rules (parameterize values / escape inputs).
          </li>
          <li>
            Add a connection file + env var in <C>@hive/connection</C> (keep it separate
            from other engines).
          </li>
          <li>Register it in <C>createAdapter(dbType)</C> in <C>packages/dal/src/factory.ts</C>.</li>
          <li>Only add a <C>QuerySpec</C> operator if <strong>every</strong> engine can support it.</li>
        </ol>
      </Section>

      <Section title="Add a new config value">
        <ul>
          <li>Secret / connection string → <C>env.local</C> (service-local or global). Never commit secrets.</li>
          <li>Read a required value with <C>requireEnv('KEY')</C> from <C>@hive/connection/env</C> (throws if missing).</li>
          <li>Read an optional value with <C>optionalEnv('KEY', fallback)</C>.</li>
        </ul>
      </Section>

      <Section title="Add a Tier-2 middleware (rate-limit, validation, …)">
        <ul>
          <li>Write a function returning an Express <C>RequestHandler</C>.</li>
          <li>Register it <strong>after</strong> <C>corePipeline</C> and <strong>before</strong> <C>errorHandler</C>.</li>
          <li>Fail closed; forward errors via <C>next(err)</C>.</li>
          <li>Don't change the Tier-1 order.</li>
        </ul>
      </Section>

      <Section title="Add a documentation page (shows up in the portal)">
        <ol>
          <li>
            Best: create a rich JSX page at{' '}
            <C>portal/src/pages/&lt;group&gt;/&lt;file&gt;.tsx</C> exporting <C>meta</C> + a
            default component (see <DocLink to="about/devportal">the docs portal</DocLink>).
            Quick option: drop a <C>.md</C> file into <C>about/</C>, <C>rules/</C>, or{' '}
            <C>docs/</C> — it appears via the markdown fallback.
          </li>
          <li>
            Use <C>file: 'index'</C> (or a <C>README.md</C>) to become that section's{' '}
            <strong>Overview</strong>; other files become sub-pages (<C>#/about/&lt;name&gt;</C>).
          </li>
          <li>
            A brand-new file needs a portal reload/restart so Vite re-scans. To add a whole
            new section (folder), update the globs and group maps in <C>portal/src/content.ts</C>.
          </li>
        </ol>
      </Section>

      <Section title="Keep the docs in sync (required)">
        <Callout kind="danger">
          Whenever you add or change something in the framework, update the docs{' '}
          <strong>in the same change</strong> — not later. Always ask: "does this affect MINT
          or another module?" If yes, the update is bigger than one page.
        </Callout>
        <ol>
          <li>
            <strong><C>about/</C></strong> — update the matching module page. Changed how data
            reaches the database? Also update{' '}
            <DocLink to="about/how-data-flows">how-data-flows</DocLink>. Changed anything MINT
            swaps/ships? Also update{' '}
            <DocLink to="about/how-mint-works">how-mint-works</DocLink> and{' '}
            <DocLink to="about/mint">mint</DocLink>.
          </li>
          <li>
            <strong><C>rules/</C></strong> — if the change adds a new "right way", document it
            in <DocLink to="rules/coding-standards">coding-standards</DocLink> or here.
          </li>
          <li>
            <strong>FAQ</strong> — if it'll make people ask a new question, add an entry in{' '}
            <DocLink to="about/faq">faq</DocLink> linking to the deeper page.
          </li>
          <li><strong>Write it simply.</strong> Assume the reader is brand new.</li>
          <li>
            <strong>Cross-module ripple check</strong> — a new <C>QuerySpec</C> operator
            touches <C>@hive/dal</C> + every adapter + how-data-flows; a new engine
            touches <C>@hive/dal</C> + <C>@hive/connection</C> + mint; a new MINT
            mode/capability touches how-mint-works + the MINT rules.
          </li>
        </ol>
      </Section>

      <NextSteps>
        <Card icon="✍️" title="Coding standards" to="rules/coding-standards">
          The rules for the code itself.
        </Card>
        <Card icon="🧩" title="Sample service" to="about/demo-service">
          A working reference to copy.
        </Card>
      </NextSteps>

      <p className="contact">
        Questions? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
