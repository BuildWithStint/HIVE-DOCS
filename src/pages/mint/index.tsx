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
import { MintLogo } from '../../components/Logos';

export const meta = {
  group: 'mint',
  file: 'index',
  title: 'MINT overview',
  order: 0,
};

export default function MintOverview() {
  return (
    <Page>
      <div style={{ marginBottom: 20 }}>
        <MintLogo size={150} />
      </div>
      <PageHeader
        kicker="MINT (read-only)"
        title="MINT — overview"
        lead={
          <>
            MINT is a <strong>separate, private tool</strong>. This page is shown read-only
            so you know what MINT is. The full, beginner-friendly explanation lives in the
            platform docs: <DocLink to="about/how-mint-works">how MINT works and extracts</DocLink>.
          </>
        }
      />

      <Callout kind="danger" title="The golden rule">
        Do not run, change, or ship MINT without coordinating first. It checks IDs, swaps
        secret sauce, and audits everything for a reason.
      </Callout>

      <Section title="In one sentence">
        <p>
          MINT is the <strong>packaging tool</strong> that produces a shippable copy of a
          HIVE service for a customer — swapping HIVE-internal "secret sauce" for shippable
          equivalents and reshaping the service for how that customer will run it.
        </p>
      </Section>

      <Section title="The simple picture (a magic photocopier)">
        <Mermaid
          caption="Four magical steps, in a frozen order."
          chart={`
flowchart LR
    ID["1. checks your ID"] --> SWAP["2. swaps the secret ingredient"]
    SWAP --> SIZE["3. resizes the recipe<br/><small>pooled / silo</small>"]
    SIZE --> TASTE["4. taste-tests the result"]
`}
        />
        <Steps>
          <Step title="Checks your ID">
            Only authorized operators may run it.
          </Step>
          <Step title="Swaps the secret ingredient">
            E.g. the fast range id-allocator becomes the simple counter allocator the
            customer ships with.
          </Step>
          <Step title="Resizes the recipe">
            A shared multi-tenant build ("pooled") or a private single-tenant build ("silo").
          </Step>
          <Step title="Taste-tests the result">
            A post-generation gate verifies the output before it's handed over.
          </Step>
        </Steps>
        <Callout kind="key">
          The order of those steps is <strong>frozen</strong> for safety.
        </Callout>
      </Section>

      <Section title="It copies — your services stay untouched">
        <Callout kind="key">
          MINT <strong>reads</strong> the platform and <strong>writes a new copy</strong>{' '}
          into the folder you pass to <C>--out</C>. It never edits or removes your original
          microservices — they stay exactly as they are. The swapped allocator, the silo
          middleware, and the single-tenant DB shape are applied only to the copy.
        </Callout>
      </Section>

      <Section title="How to use it (the commands)">
        <Callout kind="danger" title="Coordinate before you run it">
          Don't run a real extraction without permission. These commands are shown so you
          understand what MINT does; today the binary validates input and prints the
          resolved intent.
        </Callout>
        <p>One command, <C>extract</C>:</p>
        <CodeBlock
          lang="bash"
          code={`mint extract \\
  --microservice <Name> \\
  --db mongo|postgres \\
  --name <output-name> \\
  --token <credential> \\
  [--mode pooled|silo]`}
        />
        <p>Example — a single-tenant Mongo copy of the tasks service:</p>
        <CodeBlock
          lang="bash"
          code={`mint extract --microservice tasks --db mongo --mode silo \\
  --out ./out/tasks-acme --token "$MINT_TOKEN"`}
        />
        <p>
          See the full flag table and more examples in{' '}
          <DocLink to="about/how-mint-works">how MINT works → How to use it</DocLink>.
        </p>
      </Section>

      <Section title="Where to read more">
        <ul>
          <li>
            <DocLink to="about/how-mint-works">how-mint-works</DocLink> — the full story plus
            the 9-step pipeline, explained simply.
          </li>
          <li>
            <DocLink to="about/mint">about/mint</DocLink> — the short module overview.
          </li>
          <li>
            <DocLink to="rules/mint">rules/mint</DocLink> — the rules for running/changing
            MINT.
          </li>
        </ul>
      </Section>

      <Section title="For maintainers">
        <p>The two pages below are MINT's own working notes, shown here for convenience:</p>
        <ul>
          <li>
            <DocLink to="mint/AGENTS">Agent guide</DocLink> — how the tooling assistant should
            work on MINT.
          </li>
          <li>
            <DocLink to="mint/CONTEXT">Context / memory</DocLink> — MINT's internal state,
            decisions, and gotchas.
          </li>
        </ul>
      </Section>

      <NextSteps>
        <Card icon="🪄" title="How MINT works" to="about/how-mint-works">
          The full beginner-friendly deep dive.
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
