import {
  Page,
  PageHeader,
  Section,
  Sub,
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
  group: 'docs',
  file: 'commands',
  title: 'Command reference',
  order: 2,
};

export default function Commands() {
  return (
    <Page>
      <PageHeader
        kicker="Setup & Reference"
        title="Command reference"
        lead="Every command you'll use in HIVE, grouped by job, with a plain-English explanation of what it does and when to run it."
      />

      <Callout kind="key" title="The mental model">
        <strong>pnpm</strong> installs and links packages. <strong>Nx</strong> runs
        tasks (build, test, typecheck) and is smart about caching — it only redoes
        work for the projects that actually changed.
      </Callout>

      <Mermaid
        caption="Two tools, two jobs: pnpm manages dependencies; Nx runs and caches tasks."
        chart={`
flowchart LR
    subgraph pnpm["pnpm — dependencies"]
      I["pnpm install"]
    end
    subgraph nx["Nx — tasks"]
      B["build"]
      T["test"]
      TC["typecheck"]
    end
    I --> nx
    B --> Cache[("Nx cache<br/>(reuses results)")]
    T --> Cache
    TC --> Cache
`}
      />

      <Section title="Setup commands">
        <Sub title="pnpm install" />
        <p>
          Installs dependencies for <strong>every</strong> package in the workspace
          into one shared <C>node_modules</C>. Run it once after cloning, and again
          whenever a <C>package.json</C> changes.
        </p>
        <CodeBlock lang="bash" code={`pnpm install`} />

        <Sub title="npx nx sync" />
        <p>
          Updates the TypeScript <strong>project references</strong> so packages can
          see each other's types. Run it after you add a{' '}
          <C>"@hive/x": "workspace:*"</C> dependency (after <C>pnpm install</C>).
          Sometimes you must run it twice.
        </p>
        <Callout kind="warn">
          Skipping <C>nx sync</C> after adding a workspace dependency gives{' '}
          <C>TS2307: Cannot find module '@hive/…'</C>.
        </Callout>
      </Section>

      <Section title="Build / typecheck / test">
        <p>
          These all follow the same shape: <C>npx nx &lt;target&gt; &lt;project&gt;</C>.
        </p>
        <Table
          head={['Command', 'What it does']}
          rows={[
            [<C>npx nx build @hive/&lt;name&gt;</C>, 'Compiles one package to its dist/ with tsc. Builds its dependencies first; returns a cached result instantly if nothing changed.'],
            [<C>npx nx typecheck @hive/&lt;name&gt;</C>, 'Type-checks without emitting files — fast feedback that types are correct.'],
            [<C>npx nx test @hive/&lt;name&gt;</C>, "Runs that package's Jest tests."],
            [<C>npx nx show project @hive/&lt;name&gt; --json</C>, 'Lists the targets you can run for a project.'],
          ]}
        />
        <p>The "is everything still green?" command:</p>
        <CodeBlock
          lang="bash"
          code={`# run typecheck AND test for every project
npx nx run-many -t typecheck test --all

# force a clean run (ignore the cache)
npx nx run-many -t typecheck test --all --skip-nx-cache`}
        />
      </Section>

      <Section title="Why builds feel instant (Nx caching)">
        <p>
          Nx remembers the inputs and outputs of each task. Run a build twice
          without changing anything and the second run is pulled straight from the
          cache. Change one file and only the affected projects rebuild — which is
          why running across the whole repo is usually fast.
        </p>
        <Mermaid
          caption="A task only re-runs when its inputs change; otherwise its cached output is reused."
          chart={`
flowchart TD
    A["nx build @hive/x"] --> Q{"Inputs changed<br/>since last run?"}
    Q -- "No" --> C["Reuse cached output ⚡<br/>(near-instant)"]
    Q -- "Yes" --> R["Run tsc, store new output"]
`}
        />
      </Section>

      <Section title="Running the docs portal">
        <Table
          head={['Command', 'What it does']}
          rows={[
            [<C>pnpm hive</C>, 'Starts this docs portal on http://localhost:7777 (Vite). Local only. Editing a page hot-reloads.'],
            [<C>pnpm hive:build</C>, 'Builds the portal into static files (portal/dist/) — if you ever want to host the rendered docs internally.'],
          ]}
        />
      </Section>

      <Section title="Running the sample service">
        <CodeBlock
          lang="bash"
          code={`DB=mongo node apps/catalog/src/main.ts   # needs MONGO_URL in env.local`}
        />
        <p>
          The service sets <C>HIVE_SERVICE_DIR</C>, connects to Mongo, and listens on{' '}
          <C>PORT</C> (default 4020). See{' '}
          <DocLink to="about/catalog-service">the catalog service</DocLink>.
        </p>
      </Section>

      <Section title="Extract a standalone copy (MINT)">
        <Sub title="mint extract" />
        <p>
          MINT vendors <C>@hive/connection</C> + <C>@hive/dal</C> (the query core + the
          chosen adapter) into a standalone copy that runs with no workspace.
        </p>
        <CodeBlock
          lang="bash"
          code={`MINT_REPO=$PWD node MINT/dist/cli/main.js extract \\
  --microservice catalog --db mongo --mode silo \\
  --name catalog-mongo --token local-dev`}
        />
        <p>
          Use <C>--db postgres</C> for the Postgres adapter. Details:{' '}
          <DocLink to="docs/testing-postgres">testing with Postgres</DocLink>.
        </p>
      </Section>

      <Section title="Generating a new package (scaffolding)">
        <CodeBlock
          lang="bash"
          code={`npx nx g @nx/js:library <name> --directory=packages/<name> \\
  --bundler=tsc --unitTestRunner=jest --no-interactive`}
        />
        <p>
          Creates a new library under <C>packages/&lt;name&gt;</C> wired into the
          workspace. Delete the generated stub files, then add your code. For
          services use <C>--directory=apps/&lt;name&gt;</C>. Full steps:{' '}
          <DocLink to="rules/how-to-add">how to add things</DocLink>.
        </p>
      </Section>

      <Section title="Quick cheat-sheet">
        <Table
          head={['I want to…', 'Command']}
          rows={[
            ['Install deps', <C>pnpm install</C>],
            ['Wire a new workspace dep', <C>pnpm install → npx nx sync</C>],
            ['Read the docs', <C>pnpm hive</C>],
            ['Build one package', <C>npx nx build @hive/&lt;name&gt;</C>],
            ['Test one package', <C>npx nx test @hive/&lt;name&gt;</C>],
            ['Verify the whole repo', <C>npx nx run-many -t typecheck test --all</C>],
            ['Run the sample API', <C>DB=mongo node apps/catalog/src/main.ts</C>],
            ['Extract a standalone copy', <C>node MINT/dist/cli/main.js extract …</C>],
            ['Scaffold a package', <C>npx nx g @nx/js:library …</C>],
          ]}
        />
      </Section>

      <NextSteps>
        <Card icon="🚀" title="Getting started" to="docs/getting-started">
          The full setup walkthrough.
        </Card>
        <Card icon="🧠" title="How it works inside" to="docs/internals">
          What each command is actually building.
        </Card>
      </NextSteps>

      <p className="contact">
        Questions? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
