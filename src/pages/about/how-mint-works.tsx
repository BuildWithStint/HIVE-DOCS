import {
  Page,
  PageHeader,
  Section,
  Sub,
  Callout,
  CodeBlock,
  Table,
  Steps,
  Step,
  C,
  DocLink,
  NextSteps,
  Card,
} from '../../components/ui';
import { Mermaid } from '../../components/Mermaid';

export const meta = {
  group: 'about',
  file: 'how-mint-works',
  title: 'How MINT works (deep dive)',
  order: 6,
};

export default function HowMintWorks() {
  return (
    <Page>
      <PageHeader
        kicker="Deep dive"
        title="How MINT works and how it extracts"
        lead={
          <>
            The long, beginner-friendly version. If words like "extractor",
            "capability module", or "isolation mode" sound scary — don't worry. This
            page explains all of them with a simple story first, then the real
            details. (The short summary is in <DocLink to="about/mint">mint</DocLink>.)
          </>
        }
      />

      <Callout kind="danger" title="MINT is private">
        MINT lives in its own folder (<C>/MINT</C>) and is <strong>not</strong> part
        of the shipped platform. Do not run, change, or ship it without coordinating
        first.
      </Callout>

      <Section title="The story: the magic photocopier">
        <p>
          Imagine HIVE is a <strong>recipe book</strong> kept in a locked kitchen.
          Some recipes contain a <strong>secret family ingredient</strong> (clever
          tricks we don't want to give away). When a customer buys a "starter
          kitchen", we don't hand them the locked book. Instead we use a{' '}
          <strong>magic photocopier</strong> called <strong>MINT</strong>.
        </p>
        <Mermaid
          caption="MINT does four magical things while copying."
          chart={`
flowchart LR
    IN["HIVE platform<br/>(the locked recipe book)"] --> M{{MINT<br/>magic photocopier}}
    M --> O["Shippable copy<br/>for the customer"]
    M -.-> C1["1. checks your ID"]
    M -.-> C2["2. swaps the secret ingredient"]
    M -.-> C3["3. resizes the recipe (pooled / silo)"]
    M -.-> C4["4. taste-tests the result"]
`}
        />
        <Callout kind="key">
          MINT in one breath: a careful, permission-checked copier that produces a
          shippable version of HIVE with the secret parts replaced and verified.
        </Callout>
      </Section>

      <Section title="What &quot;extract&quot; means here">
        <p>
          "Extract" = <strong>produce a clean, shippable copy of the platform for a
          customer</strong>, with HIVE-internal secret pieces swapped for ordinary
          equivalents, shaped for how that customer will run it (shared vs.
          single-tenant). Nothing is "deleted from HIVE". MINT reads a{' '}
          <strong>plan</strong> and produces <strong>output files</strong>.
        </p>
      </Section>

      <Section title="MINT copies — it never changes your microservices">
        <Callout kind="key" title="Your doubt, answered">
          Correct. MINT <strong>reads</strong> your platform and <strong>writes a brand
          new copy</strong> into an output folder you choose (<C>--out</C>). It{' '}
          <strong>never edits, removes, or rewrites the original microservices</strong> —
          your source stays exactly as it is. The copy is where the swaps and the new
          middleware/DB shape get applied.
        </Callout>
        <Mermaid
          caption="Source on the left is read-only. All changes happen only in the generated copy on the right."
          chart={`
flowchart LR
    subgraph SRC["Your platform (READ-ONLY — untouched)"]
      A["apps/catalog"]
      B["@hive/dal / @hive/connection"]
      C0["middleware (corePipeline)"]
    end
    SRC ==>|MINT reads| M{{MINT}}
    M ==>|MINT writes| OUT
    subgraph OUT["output/&lt;name&gt; (the new copy)"]
      D["copied service + business logic"]
      E["dal/index.ts: inline queries (one engine, no adapter)"]
      F["db/: shipped schema (sql / mongo)"]
      G["silo: tenancy stripped"]
    end
`}
        />
        <p>
          Think of it like a photocopier: the original book never leaves the shelf. MINT
          makes a <strong>new copy</strong> and edits the copy. Because tenant isolation
          lives in <strong>one interface-based layer</strong>, reshaping the copy (for
          example, switching to silo) is a <strong>strategy swap, not a rewrite</strong>{' '}
          — the business logic, repositories, and models are copied across{' '}
          <strong>intact</strong>.
        </p>
        <Table
          head={['Question', 'Answer']}
          rows={[
            ['Does MINT change my original service?', <>No. The source is read-only. Only the copy in <C>output/&lt;name&gt;</C> is written.</>],
            ['Does the copy carry its own data layer?', <>Yes — MINT <strong>replaces</strong> the generic <C>@hive/dal</C> with ONE concrete <C>src/lib/dal/index.ts</C> of inline driver queries for the chosen engine, so it runs with no workspace.</>],
            ['Does the copy get its own database setup?', <>Yes — MINT ships <C>db/schema.sql</C> (Postgres) or <C>db/schema.mongo.json</C> (Mongo) for exactly the tables that service owns.</>],
            ['Does the copy get its own tenancy shape?', <>Yes — silo builds <C>new Repository()</C> (runs unscoped for one tenant); pooled builds <C>new Repository(currentOrgId)</C>. Either way, your original is untouched.</>],
            ['Is my business logic rewritten?', 'No. Routes stay identical; only the data layer (inline queries) and tenancy are fixed for the copy.'],
          ]}
        />
      </Section>


      <Section title="The key nouns (plain language)">
        <Table
          head={['MINT word', 'Think of it as', 'What it really is']}
          rows={[
            [<strong>ProjectPlan</strong>, 'the shopping list', 'An immutable description of what to produce. Every step returns a new plan, never edits the old one.'],
            [<strong>Binding</strong>, '"use this brand"', 'A note saying "for this job, use implementation X" (e.g. which id-allocator).'],
            [<strong>Registry</strong>, 'a labelled drawer', 'A safe lookup table. Ask for a key; if it\'s missing it refuses (fails closed) instead of guessing.'],
            [<strong>Capability module</strong>, 'an add-on pack', 'An optional feature you can switch on (e.g. caching). Each knows how to add itself to the plan.'],
            [<strong>Isolation mode</strong>, 'kitchen size', '"pooled" (shared, multi-tenant) or "silo" (one tenant, private).'],
            [<strong>Swap</strong>, 'the ingredient switch', 'Replaces a secret-sauce piece with a shippable equivalent.'],
            [<strong>Operator</strong>, 'the person at the copier', 'Who is running the extraction; must be authorized.'],
            [<strong>Audit log</strong>, 'the security camera', 'Records that an extraction began and whether it finished or failed.'],
            [<strong>Post-gen gate</strong>, 'the taste test', 'A final check ("does it install / typecheck / boot?") before the result is accepted.'],
          ]}
        />
      </Section>

      <Section title="What MINT swaps: inline data layer + shipped schema + tenancy">
        <p>
          On extract, MINT replaces the generic workspace data layer with self-contained,
          adapter-free code for the one chosen engine:
        </p>
        <Mermaid
          caption="MINT replaces the generic @hive/dal with one concrete file of inline queries, and ships the service's schema."
          chart={`
flowchart LR
    A["@hive/dal<br/><small>generic adapters + query AST</small>"] -->|MINT replace| B["src/lib/dal/index.ts<br/><small>inline mongo / sql queries, one engine</small>"]
    S["schema/*.table.ts"] -->|MINT ship| D["db/schema.sql or db/schema.mongo.json"]
`}
        />
        <p>
          The copy gets ONE concrete <C>dal/index.ts</C> — for Mongo, direct{' '}
          <C>db.collection(...)</C> driver calls; for Postgres, parameterised SQL (<C>$1</C>{' '}
          placeholders, <C>ILIKE</C>, <C>RETURNING</C>). No adapter, no query AST, no engine
          switch. The same <C>Repository</C> methods the routes already call (<C>fetch</C>,{' '}
          <C>fetchOne</C>, <C>insert</C>, <C>update</C>, <C>remove</C>, <C>count</C>) are
          implemented directly against the driver, so a junior dev can read it top to
          bottom. MINT also ships the <DocLink to="docs/database">schema</DocLink> for the
          tables that service owns.
        </p>
      </Section>

      <Section title="The extraction pipeline (the 9 steps, in order)">
        <p>
          MINT's core is the <strong>Extractor</strong>, and it is{' '}
          <strong>frozen</strong> — the <em>order</em> never changes, which is what
          makes it trustworthy.
        </p>
        <Mermaid
          caption="The frozen 9-step pipeline. ID is checked before anything is recorded; the result is tasted before it ships."
          chart={`
flowchart TD
    S1["1. Check operator's ID"] --> S2["2. Pick the swaps"]
    S2 --> S3["3. Audit: begin"]
    S3 --> S4["4. Resolve project graph"]
    S4 --> S5["5. Apply isolation mode"]
    S5 --> S6["6. Turn on capabilities"]
    S6 --> S7["7. Write output files"]
    S7 --> S8["8. Taste test (post-gen gate)"]
    S8 --> S9["9. Audit: complete"]
    S1 -. "not authorized" .-> X1["hard stop (nothing recorded)"]
    S8 -. "fails" .-> X2["abort loudly (never ship a broken copy)"]
`}
        />
        <Steps>
          <Step title="Check the operator's ID">
            If the person isn't authorized, stop immediately — <em>before</em> anything
            is recorded or produced. (Unauthorized = hard error.)
          </Step>
          <Step title="Resolve the engine + tenancy">
            Resolve which engine the inline data layer targets (from <C>--db</C>) and
            whether the copy is pooled or silo.
          </Step>
          <Step title="Open the security camera (audit: begin)">
            Now that we're authorized, record "an extraction started". From here on, if
            anything fails, we mark the audit as <strong>failed</strong> and re-throw —
            never fail silently.
          </Step>
          <Step title="Resolve the project graph">
            Figure out what files/pieces are involved.
          </Step>
          <Step title="Apply the isolation mode">
            Shape the plan for <strong>pooled</strong> or <strong>silo</strong> (see
            below).
          </Step>
          <Step title="Turn on chosen capabilities">
            Each selected capability module adds itself to the plan.
          </Step>
          <Step title="Write the output files">
            Produce the actual shippable files via a file-system port.
          </Step>
          <Step title="Run the taste test (post-gen gate)">
            Verify the output (e.g. it should install / typecheck / boot). If it fails,{' '}
            <strong>abort loudly</strong> — a broken copy must never reach a customer.
          </Step>
          <Step title="Close the camera (audit: complete)">
            Record success and return the result.
          </Step>
        </Steps>
        <Callout kind="warn" title="Why frozen?">
          Security depends on order. You must check ID <strong>before</strong>{' '}
          recording, and taste <strong>before</strong> shipping. Freezing the sequence
          means nobody can accidentally reorder it into something unsafe. New behavior
          is added by plugging in new <em>modules/swaps</em>, not by editing the
          pipeline.
        </Callout>
      </Section>

      <Section title="Pooled vs. silo (the two kitchen sizes)">
        <Table
          head={['Mode', 'What it is', 'What MINT does']}
          rows={[
            [<strong>Pooled</strong>, 'The normal HIVE shape: many tenants share one service and one database; every row has an orgId; the guard filters by tenant.', 'Leaves the multi-tenant scaffolding in place.'],
            [<strong>Silo</strong>, 'One customer, all to themselves. Only ever one tenant.', 'Records code-level transforms (see below).'],
          ]}
        />
        <Sub title="In silo mode MINT" />
        <ul>
          <li>builds <C>new Repository()</C> with no tenant provider at <C>make-repository.ts</C>,</li>
          <li>so the inline queries run <strong>unscoped</strong> for the single tenant,</li>
          <li>drops the <C>orgId</C> column from the shipped <C>db/</C> schema.</li>
        </ul>
        <p>
          The result still works; it's just simplified because the "many families"
          problem doesn't exist for a single-tenant install.
        </p>
      </Section>

      <Section title="How to use it (the CLI &amp; its commands)">
        <Callout kind="danger" title="Permission first — but here's how it works">
          You may <strong>not</strong> run a real extraction without coordinating first.
          The commands below are shown so you understand exactly what MINT does. Today the
          binary <strong>validates your input and prints the resolved intent</strong> (the
          risky plug-ins are wired only once there are services to extract).
        </Callout>

        <Sub title="The one command: extract" />
        <p>MINT has a single command, <C>extract</C>. The shape is:</p>
        <CodeBlock
          lang="bash"
          code={`mint extract \\
  --microservice <Name> \\
  --db mongo|postgres \\
  --name <output-name> \\
  --token <credential> \\
  [--mode pooled|silo]`}
        />

        <Sub title="Every flag, explained" />
        <Table
          head={['Flag', 'Required?', 'What it means']}
          rows={[
            [<C>--microservice &lt;Name&gt;</C>, 'Yes', <>Which service to copy (alias: <C>--service</C>).</>],
            [<C>--db mongo|postgres</C>, 'Yes', 'Which database engine the copy targets. Must be exactly mongo or postgres.'],
            [<C>--name &lt;output-name&gt;</C>, 'Yes', <>Names the output folder under <C>output/</C>. Your source is never written to.</>],
            [<C>--token &lt;credential&gt;</C>, 'Yes', 'Proves you are an authorized operator. Never printed back in logs.'],
            [<C>--mode pooled|silo</C>, <>No (default <C>silo</C>)</>, <><strong>silo</strong> = single-tenant copy; <strong>pooled</strong> = keep the shared multi-tenant shape.</>],
          ]}
        />

        <Sub title="Example 1 — a single-tenant (silo) Mongo copy" />
        <CodeBlock
          lang="bash"
          code={`MINT_REPO=$PWD node MINT/dist/cli/main.js extract \\
  --microservice catalog \\
  --db mongo \\
  --mode silo \\
  --name catalog-mongo \\
  --token local-dev`}
        />
        <p>
          This reads the <C>catalog</C> service and writes a single-tenant copy into{' '}
          <C>output/catalog-mongo</C> — with inline Mongo queries and tenancy stripped. Your
          real <C>apps/catalog</C> is untouched.
        </p>

        <Sub title="Example 2 — a shared (pooled) Postgres copy" />
        <CodeBlock
          lang="bash"
          code={`MINT_REPO=$PWD node MINT/dist/cli/main.js extract \\
  --microservice catalog \\
  --db postgres \\
  --mode pooled \\
  --name catalog-pg \\
  --token local-dev`}
        />
        <p>
          This keeps the multi-tenant scoping (the inline queries still scope by the current
          tenant) and ships the Postgres <C>db/schema.sql</C>.
        </p>

        <Sub title="What you'll see today" />
        <p>
          The binary parses and reports the resolved request (with the token hidden), or
          exits non-zero with a clear message on bad input:
        </p>
        <CodeBlock
          lang="text"
          code={`Resolved extraction request:
{
  "serviceName": "catalog",
  "db": "mongo",
  "mode": "silo",
  "outputName": "catalog-mongo",
  "capabilities": []
}

# bad input, e.g. a wrong engine:
mint: --db must be 'mongo' or 'postgres'.`}
        />

        <Callout kind="note">
          Because MINT is private and powerful, the real plug-ins for the riskiest steps
          are intentionally <strong>pluggable and, in this repo, stubbed/deferred</strong>:
          a real project-graph resolver (from the Nx graph), a template-based file-system
          writer, a signed-token operator authorizer, a persistent audit log, a post-gen
          gate that installs + typechecks + boots the output, and the real
          redis/queue/cache capability modules and silo codemods. The <strong>shape</strong>{' '}
          (ports + frozen pipeline) is final; those concrete plug-ins get filled in
          carefully.
        </Callout>
      </Section>


      <Section title="The golden rule">
        <Callout kind="danger">
          <strong>Do not run, change, or ship MINT without coordinating first.</strong>{' '}
          It checks IDs, replaces the data layer with inline queries, and audits everything
          for a reason. If you need a new engine, a new capability, or a new mode, talk to
          the maintainer and add a <strong>module/registry entry</strong> — never bend the
          frozen pipeline.
        </Callout>
      </Section>

      <NextSteps>
        <Card icon="📦" title="MINT overview" to="about/mint">
          The short version.
        </Card>
        <Card icon="📐" title="MINT rules" to="rules/mint">
          What you may and may not touch.
        </Card>
      </NextSteps>

      <p className="contact">
        Questions? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
