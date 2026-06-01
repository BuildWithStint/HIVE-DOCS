import {
  Page,
  PageHeader,
  Section,
  Callout,
  Table,
  C,
  DocLink,
  NextSteps,
  Card,
} from '../../components/ui';

export const meta = {
  group: 'mint',
  file: 'AGENTS',
  title: 'MINT — agent guide',
  order: 1,
};

export default function MintAgents() {
  return (
    <Page>
      <PageHeader
        kicker="MINT (read-only)"
        title="Agent guide — MINT"
        lead="You are a senior tooling developer working on MINT (Module Isolation from Nx Toolkit), HIVE's proprietary extraction tool that mints self-contained, single-tenant product copies out of the HIVE monorepo."
      />

      <Section title="What this module is">
        <p>
          A standalone, <strong>gitignored</strong> project (its own private repo — never
          committed with the platform). A frozen extractor core plus pluggable strategies:
        </p>
        <Table
          head={['Piece', 'Role']}
          rows={[
            [<C>Extractor</C>, 'The frozen, ordered pipeline (Template Method).'],
            [<>Ports (<C>OperatorAuth</C>, <C>AuditLog</C>, <C>ProjectGraph</C>, <C>FileSystemPort</C>, <C>PostGenGate</C>)</>, 'All I/O behind interfaces (Dependency Inversion).'],
            [<><C>IsolationMode</C> strategies</>, <><C>PooledMode</C> (multi-tenant source) and <C>SiloMode</C> (single-tenant copy + secret-sauce swap).</>],
            [<C>CapabilityModule</C>, <>Composable feature generators (<C>applyTo(plan, options)</C>).</>],
            [<C>SecretSauceRegistry</C>, 'Swaps optimized platform-only impls for standard ones.'],
            [<C>parseArgs</C>, <><C>mint extract ...</C> argument parsing.</>],
          ]}
        />
      </Section>

      <Section title="Before you change anything">
        <ol>
          <li>
            MINT is the <strong>extraction layer</strong>. Changes to HIVE's <C>dal-core</C>,{' '}
            <C>tenant-context</C>, <C>security</C>, or the secret-sauce-vs-standard split affect
            MINT. Keep MINT's swaps + silo notes in sync with those modules.
          </li>
          <li>
            The optimized platform implementations (e.g. <C>RangeReservationAllocator</C>)
            MUST NOT ship in an extract — register every such impl in the{' '}
            <C>SecretSauceRegistry</C> with its standard replacement.
          </li>
          <li>
            After a confirmed change, update <DocLink to="mint/CONTEXT">CONTEXT</DocLink> in
            this folder.
          </li>
        </ol>
      </Section>

      <Section title="Hard rules">
        <Callout kind="danger">
          <ul>
            <li>
              The extractor core is frozen: extend via new modes / capability modules / ports,
              never edit the pipeline for a one-off need (Open/Closed).
            </li>
            <li>Everything is injected — no concrete Nx / fs / auth in the core.</li>
            <li>
              Fail closed: unauthorized operator rejects before any side effect; the post-gen
              gate throws loudly and the project is never handed over broken.
            </li>
            <li>
              Generate from real compiled templates + the Nx graph (no string-concat, no
              guessed deps) when the real adapters are implemented.
            </li>
            <li>
              Never commit MINT into the monorepo (it is in the monorepo <C>.gitignore</C>).
            </li>
          </ul>
        </Callout>
      </Section>

      <NextSteps>
        <Card icon="🧠" title="MINT context" to="mint/CONTEXT">
          State, decisions, and gotchas.
        </Card>
        <Card icon="🪄" title="How MINT works" to="about/how-mint-works">
          The beginner-friendly deep dive.
        </Card>
      </NextSteps>

      <p className="contact">
        Questions? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
