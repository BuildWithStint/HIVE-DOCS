import {
  Page,
  PageHeader,
  Section,
  Sub,
  Callout,
  CodeBlock,
  Steps,
  Step,
  Card,
  Table,
  C,
  DocLink,
  NextSteps,
} from '../../components/ui';
import { Mermaid } from '../../components/Mermaid';

export const meta = {
  group: 'docs',
  file: 'getting-started',
  title: 'Getting started (setup)',
  order: 1,
};

export default function GettingStarted() {
  return (
    <Page>
      <PageHeader
        kicker="Setup & Reference"
        title="Getting started"
        lead={
          <>
            From a fresh clone to a running service and these docs — step by step.
            No prior knowledge of the codebase is assumed. If you can copy, paste,
            and press Enter, you can do this.
          </>
        }
      />

      <Callout kind="tip" title="The three commands you'll use most">
        <ul>
          <li>
            <C>pnpm install</C> — set everything up (run once, and again when
            dependencies change).
          </li>
          <li>
            <C>pnpm hive</C> — open these docs in your browser.
          </li>
          <li>
            <C>npx nx run-many -t typecheck test --all</C> — check that nothing is
            broken.
          </li>
        </ul>
      </Callout>

      <Section title="The big picture (read this first)">
        <p>
          HIVE is a <strong>monorepo</strong>: one Git repository that holds many
          small projects (called <em>packages</em> and <em>services</em>) that
          share one set of tools and one <C>node_modules</C>. Think of it like one
          big apartment building where every flat (project) shares the same front
          door, plumbing, and electricity.
        </p>
        <Mermaid
          caption="The repository at a glance: shared libraries (packages) power runnable apps (services); the portal renders the docs."
          chart={`
flowchart TD
    subgraph Repo["HIVE monorepo"]
      direction TB
      P["packages/*<br/>(shared libraries)"]
      S["apps/*<br/>(runnable apps, e.g. tasks)"]
      D["about/ rules/ docs/ MINT/<br/>(the documentation)"]
      PT["portal/<br/>(this docs site)"]
    end
    P --> S
    D --> PT
    S -. "you run these" .-> You((You))
    PT -. "you read these" .-> You
`}
        />
        <Table
          head={['Folder', 'What lives there', 'Runnable?']}
          rows={[
            [<C>packages/*</C>, 'Reusable libraries (the DAL, security, config…)', 'No — imported by services'],
            [<C>apps/*</C>, 'Real apps with an HTTP API (e.g. tasks)', 'Yes — you start these'],
            [<C>about/ rules/ docs/</C>, 'The Markdown + JSX documentation', 'Read in the portal'],
            [<C>portal/</C>, 'This docs website (Vite + React)', 'Yes — pnpm hive'],
          ]}
        />
      </Section>

      <Section title="1. What you need first (prerequisites)">
        <Table
          head={['Tool', 'Version', 'Why you need it']}
          rows={[
            [<strong>Node.js</strong>, '24+', 'Runs all the JavaScript/TypeScript'],
            [<strong>pnpm</strong>, '10+', 'Installs packages (this repo is a pnpm workspace)'],
            [<strong>MongoDB</strong>, 'any (Atlas free tier is fine)', 'Where the sample service stores its data'],
          ]}
        />
        <p>Check what you already have:</p>
        <CodeBlock
          lang="bash"
          code={`node -v   # should print v24.x or higher
pnpm -v   # should print 10.x or higher`}
        />
        <Callout kind="note" title="Missing pnpm?">
          Install it once with <C>npm install -g pnpm</C>, or turn on Node's built-in
          manager with <C>corepack enable</C>.
        </Callout>
      </Section>

      <Section title="2. Install everything (one command)">
        <p>From the repository root, run:</p>
        <CodeBlock lang="bash" code={`pnpm install`} />
        <p>
          This reads <C>pnpm-workspace.yaml</C>, finds every project under{' '}
          <C>packages/*</C>, <C>apps/*</C>, and <C>portal</C>, and installs all
          of their dependencies into <strong>one shared</strong> <C>node_modules</C>.
          You only re-run it when dependencies change.
        </p>
        <Callout kind="warn" title="After adding a workspace dependency">
          If you add a <C>"@hive/x": "workspace:*"</C> dependency to a package, run{' '}
          <C>pnpm install</C> <strong>then</strong> <C>npx nx sync</C> (sometimes
          twice) so TypeScript's project references get wired up. Skipping this gives{' '}
          <C>TS2307: Cannot find module '@hive/…'</C>.
        </Callout>
      </Section>

      <Section title="3. Add your secrets (env.local)">
        <p>
          Real secrets (like a database password) <strong>never</strong> go into Git.
          They live in a git-ignored file called <C>env.local</C>. Start from the
          template:
        </p>
        <CodeBlock lang="bash" code={`cp env.local.example env.local`} />
        <p>
          Then open <C>env.local</C> and set at least your MongoDB connection string:
        </p>
        <CodeBlock
          lang="bash"
          title="env.local"
          code={`MONGO_URL=mongodb+srv://<user>:<pass>@<cluster>/<db>`}
        />
        <Sub title="How config layering works" />
        <p>
          When the app asks for a setting, HIVE looks in four places. Later places
          win over earlier ones, so a real environment variable always beats a file:
        </p>
        <Mermaid
          caption="Lowest priority on the left, highest on the right. The first place that has the value, reading right-to-left, wins."
          chart={`
flowchart LR
    A["hive.properties<br/><small>platform defaults</small>"] --> B["service.properties<br/><small>per-service</small>"]
    B --> C["env.local<br/><small>your secrets</small>"]
    C --> D["process.env<br/><small>real env vars</small>"]
    style D fill:#ffc83d,stroke:#ffc83d,color:#1b1300
`}
        />
        <Table
          head={['Layer', 'Committed to Git?', 'Use it for']}
          rows={[
            [<><C>env.local</C> (global)</>, 'No (git-ignored)', 'Shared local secrets (e.g. MONGO_URL)'],
            [<><C>env.local</C> (service)</>, 'No (git-ignored)', 'Per-service local overrides'],
            [<C>process.env</C>, 'n/a', 'CI / production environment variables (highest priority)'],
          ]}
        />
        <p>
          Full detail: <DocLink to="about/connection">the connection layer</DocLink>.
        </p>
      </Section>

      <Section title="4. Read the docs in your browser (this portal)">
        <CodeBlock lang="bash" code={`pnpm hive`} />
        <p>
          That starts the <strong>HIVE docs portal</strong> — the site you are
          reading right now — on <C>http://localhost:7777</C>. It has full-text
          search (press <strong>⌘K</strong>), a sidebar, an "on this page" outline,
          and a dark/light toggle. It is <strong>local only</strong>; it never runs
          in production.
        </p>
        <Callout kind="note" title="Live editing">
          Editing an existing page and saving updates the browser instantly (hot
          reload). Adding a <em>brand-new</em> file needs a portal restart so Vite
          re-scans the folders.
        </Callout>
      </Section>

      <Section title="5. Run the sample service">
        <p>
          The <strong>demo API</strong> shows every layer working together against a
          real MongoDB. Here is the whole journey, then the commands:
        </p>
        <Mermaid
          caption="What happens when you start and call the sample service."
          chart={`
sequenceDiagram
    participant You
    participant Node as node main.ts
    participant API as demo API
    participant DB as MongoDB
    You->>Node: DB=mongo node apps/demo/src/main.ts
    Node->>API: start, listen on :4030
    You->>API: curl POST /demo (x-org-id)
    API->>DB: scoped query (only your org)
    DB-->>API: rows
    API-->>You: JSON result
`}
        />
        <Steps>
          <Step title="Start it">
            <CodeBlock
              lang="bash"
              code={`DB=mongo node apps/demo/src/main.ts
# → listening on http://localhost:4030`}
            />
          </Step>
          <Step title="Health check">
            <CodeBlock lang="bash" code={`curl -s http://localhost:4030/health`} />
          </Step>
          <Step title="Call it (org-scoped)">
            <CodeBlock
              lang="bash"
              code={`curl -s -X POST http://localhost:4030/demo -H 'x-org-id: org-A'`}
            />
          </Step>
        </Steps>
        <p>
          Full walkthrough:{' '}
          <DocLink to="about/demo-service">the demo service</DocLink>.
        </p>
      </Section>

      <Section title="6. Check everything works (tests)">
        <CodeBlock
          lang="bash"
          code={`# check every project
npx nx run-many -t typecheck test --all

# check just one project
npx nx test @hive/dal`}
        />
        <p>
          To run the live-database tests, provide the database URLs first — see{' '}
          <DocLink to="docs/testing-postgres">testing with Postgres</DocLink>.
        </p>
      </Section>

      <NextSteps>
        <Card icon="🧠" title="How it works inside" to="docs/internals">
          A deep, plain-English tour of every layer.
        </Card>
        <Card icon="⌨️" title="Command reference" to="docs/commands">
          Every command, explained line by line.
        </Card>
        <Card icon="📐" title="The rules" to="rules">
          Read these before you write any code.
        </Card>
        <Card icon="➕" title="Add something new" to="rules/how-to-add">
          Recipes for new models, services, engines.
        </Card>
      </NextSteps>

      <p className="contact">
        Questions? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
