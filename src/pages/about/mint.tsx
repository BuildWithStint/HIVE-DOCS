import {
  Page,
  PageHeader,
  Section,
  Callout,
  CodeBlock,
  C,
  DocLink,
  NextSteps,
  Card,
} from '../../components/ui';
import { Mermaid } from '../../components/Mermaid';

export const meta = {
  group: 'about',
  file: 'mint',
  title: 'MINT — the extraction tool',
  order: 4,
};

export default function Mint() {
  return (
    <Page>
      <PageHeader
        kicker="Concepts & Layers"
        title="MINT — the extraction tool"
        lead={
          <>
            The short overview. Want the long, child-simple, step-by-step version (the
            "magic photocopier" story + the 9-step pipeline)? Read{' '}
            <DocLink to="about/how-mint-works">how MINT works</DocLink>.
          </>
        }
      />

      <Section title="What it is">
        <p>
          <strong>MINT</strong> is a separate, proprietary tool that produces a tailored
          copy of a HIVE service for a client/deployment. It lives in the <C>/MINT</C>{' '}
          folder, has its own toolchain, and is <strong>never committed with the
          platform</strong> (it's git-ignored — its own private repository).
        </p>
      </Section>

      <Section title="Why it exists">
        <p>
          HIVE keeps some "secret sauce" internal (for example, a faster id-allocation
          strategy). When generating a client-facing copy, MINT swaps internal-only
          pieces for the shippable equivalents and can change how a service is structured
          (for example, isolating a single tenant).
        </p>
      </Section>

      <Section title="How it's built (high level)">
        <Mermaid
          caption="MINT applies pure transforms to an in-memory plan, then a frozen pipeline produces verified output."
          chart={`
flowchart TD
    PLAN["ProjectPlan<br/><small>in-memory, immutable</small>"] --> EX["Extractor (frozen pipeline)"]
    EX --> SWAP["Swaps<br/><small>range → counter allocator</small>"]
    EX --> MODE["Mode<br/><small>pooled / silo</small>"]
    EX --> GATE["Verify gate<br/><small>install / typecheck / boot</small>"]
    GATE --> OUT["Shippable files"]
`}
        />
        <ul>
          <li>
            It works on an <strong>in-memory plan</strong> (a <C>ProjectPlan</C>) and
            applies <strong>pure transforms</strong> — fully testable without touching
            disk or a live build.
          </li>
          <li>
            A <strong>frozen pipeline</strong> (the <C>Extractor</C>) runs fixed steps in
            order: authorize → resolve strategies → audit begin → resolve graph → apply
            isolation mode → apply capabilities → write files → verify gate → audit
            complete. Any failure is audited and re-thrown.
          </li>
          <li>
            <strong>Swaps</strong>: a registry replaces internal pieces (e.g. the
            range-reservation id allocator) with shippable ones (the gap-free counter
            allocator).
          </li>
          <li>
            <strong>Modes</strong>: "pooled" (many tenants share infrastructure) vs
            "silo" (one tenant, with the multi-tenant scaffolding stripped).
          </li>
          <li>
            A small <strong>CLI</strong> drives it (parses arguments, fails closed on bad
            input, hides secrets in output).
          </li>
        </ul>
      </Section>

      <Section title="It copies — it never changes your services">
        <Callout kind="key">
          MINT <strong>reads</strong> your platform and <strong>writes a new copy</strong>{' '}
          into the <C>--out</C> folder. Your original microservices are{' '}
          <strong>never edited or removed</strong> — they stay exactly as they are. The
          copy is what gets the swapped allocator, the silo middleware, and the
          single-tenant DB shape. See{' '}
          <DocLink to="about/how-mint-works">how MINT works</DocLink> for the full picture.
        </Callout>
      </Section>

      <Section title="How to use it (the commands)">
        <Callout kind="danger" title="Coordinate before running">
          You may not run a real extraction without coordinating first. The commands are
          shown here so you understand what MINT does; today the binary validates input and
          prints the resolved intent.
        </Callout>
        <p>MINT has one command, <C>extract</C>:</p>
        <CodeBlock
          lang="bash"
          code={`mint extract \\
  --microservice <Name> \\
  --db mongo|sql \\
  --out <dir> \\
  --token <credential> \\
  [--mode pooled|silo] \\
  [--redis] [--queue] [--cache]`}
        />
        <p>For example, a single-tenant Mongo copy of the tasks service:</p>
        <CodeBlock
          lang="bash"
          code={`mint extract --microservice tasks --db mongo --mode silo \\
  --out ./out/tasks-acme --token "$MINT_TOKEN"`}
        />
        <p>
          The full flag table, more examples, and the exact output live in{' '}
          <DocLink to="about/how-mint-works">how MINT works → How to use it</DocLink>.
        </p>
      </Section>

      <Section title="How to extend it">
        <p>
          If you need to add a new capability module or extend the silo transforms,{' '}
          <strong>contact the maintainer first</strong> — there are real adapters (graph
          resolver, file writer, signed-token auth, persistent audit, the
          install/typecheck/boot gate) that are intentionally wired only when services
          exist.
        </p>
      </Section>


      <Section title="Rule">
        <Callout kind="danger">
          Do not run MINT, change its behavior, or ship an extraction without
          coordinating with the maintainer: <strong>abdul29112004@gmail.com</strong>.
        </Callout>
      </Section>

      <NextSteps>
        <Card icon="🪄" title="How MINT works (deep dive)" to="about/how-mint-works">
          The magic-photocopier story and the 9 steps.
        </Card>
        <Card icon="📐" title="MINT rules" to="rules/mint">
          What you may and may not touch.
        </Card>
      </NextSteps>

      <p className="contact">
        Questions about MINT? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
