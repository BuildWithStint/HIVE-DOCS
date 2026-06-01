import {
  Page,
  PageHeader,
  Section,
  Callout,
  FileTree,
  C,
  NextSteps,
  Card,
} from '../../components/ui';

export const meta = {
  group: 'mint',
  file: 'CONTEXT',
  title: 'MINT — context',
  order: 2,
};

export default function MintContext() {
  return (
    <Page>
      <PageHeader
        kicker="MINT (read-only)"
        title="Context / memory — MINT"
        lead="Living record of this module's state, decisions, and gotchas. Update on every confirmed change."
      />

      <Section title="Status">
        <ul>
          <li>Frozen core + strategies implemented and tested (28 unit tests passing).</li>
          <li>
            Typecheck clean; CLI binary builds and runs (validates input, hides token, exits
            non-zero on bad input).
          </li>
          <li>Standalone CommonJS project under <C>MINT/</C>, gitignored from the monorepo.</li>
        </ul>
      </Section>

      <Section title="Public API / structure">
        <FileTree
          title="MINT/"
          nodes={[
            {
              name: 'core/',
              children: [
                { name: 'project-plan.ts', note: 'ProjectPlan (immutable), ImplementationBinding, SourceFile, DbEngine, Tenancy, withNote' },
                { name: 'ports.ts', note: 'OperatorAuth, AuditLog, ProjectGraph, FileSystemPort, PostGenGate, Operator' },
                { name: 'registry.ts', note: 'Registry<T> (fail-closed get, dup-guard)' },
                { name: 'capability-module.ts', note: 'CapabilityModule.applyTo(plan, options)' },
                { name: 'isolation-mode.ts', note: 'IsolationMode.apply(plan)' },
                { name: 'errors.ts', note: 'ExtractionError + Unauthorized/UnknownModule/PostGenGate errors' },
                { name: 'extractor.ts', note: 'Extractor (frozen 9-step pipeline), ExtractRequest, ExtractResult, ExtractorDeps, CapabilitySelection' },
              ],
            },
            { name: 'swaps/secret-sauce-registry.ts', note: 'SecretSauceRegistry, defaultSecretSauceRegistry()' },
            { name: 'modes/pooled-mode.ts · modes/silo-mode.ts', note: 'the two isolation modes' },
            { name: 'cli/parse-args.ts · cli/main.ts', note: 'parseArgs; bin entry' },
          ]}
        />
      </Section>

      <Section title="Key decisions">
        <ul>
          <li>
            Modeled extraction as pure transforms over an in-memory <C>ProjectPlan</C> so the
            whole pipeline is deterministic and testable WITHOUT a live Nx graph, real
            services, or disk.
          </li>
          <li>
            Decided secret-sauce swap: <C>RangeReservationAllocator</C> →{' '}
            <C>CounterAllocator</C> (role <C>idAllocator</C>, module <C>@hive/dal-mongoose</C>).
            The optimization never leaves the platform; clients get the correct standard impl.
          </li>
          <li>
            Silo mode performs the data-level swap (tenancy=single + binding swap) and records
            the code-level transforms (strip <C>orgId</C> + index prefix, <C>corePipeline</C> →{' '}
            <C>corePipelineSilo</C>, base-repo scoping no-op, disable <C>tenantGuard</C> plugin)
            as authoritative notes for the file generator + audit.
          </li>
          <li>
            Operator authorized BEFORE the audit begins; any post-begin failure marks the audit
            entry failed and rethrows. Post-gen gate failure aborts loudly.
          </li>
          <li>
            CommonJS + ts-jest chosen over the monorepo's ESM/nodenext to keep this standalone
            tool's toolchain simple and robust.
          </li>
        </ul>
      </Section>

      <Section title="Gotchas">
        <Callout kind="warn">
          MINT is in the monorepo <C>.gitignore</C> (<C>/MINT</C>). It must NEVER be committed
          with the platform — it is its own private repo. <C>dist/</C> is build output
          (gitignored); removed after smoke-testing.
        </Callout>
      </Section>

      <Section title="Open / deferred items (need services to exist first)">
        <ul>
          <li>
            Real port adapters: Nx-graph resolver (<C>ProjectGraph</C>), template-based{' '}
            <C>FileSystemPort</C>, signed-token <C>OperatorAuth</C>, persistent <C>AuditLog</C>,
            and the install+typecheck+boot <C>PostGenGate</C>.
          </li>
          <li>Real capability modules (<C>redis</C>, <C>queue</C>, <C>cache</C>) implementing <C>applyTo</C>.</li>
          <li>
            Real silo codemods (the notes are currently the contract; the generator will execute
            them against actual service files).
          </li>
          <li>
            <C>cli/main.ts</C> currently parses + reports intent; the composition root wiring the
            real adapters is assembled once HIVE has services to extract.
          </li>
        </ul>
      </Section>

      <NextSteps>
        <Card icon="📦" title="MINT overview" to="mint">
          The read-only summary.
        </Card>
        <Card icon="🤖" title="Agent guide" to="mint/AGENTS">
          How to work on MINT.
        </Card>
      </NextSteps>

      <p className="contact">
        Questions? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
