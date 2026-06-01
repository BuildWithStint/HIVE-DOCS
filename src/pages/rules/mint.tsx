import {
  Page,
  PageHeader,
  Section,
  Callout,
  C,
  NextSteps,
  Card,
} from '../../components/ui';
import { Mermaid } from '../../components/Mermaid';

export const meta = {
  group: 'rules',
  file: 'mint',
  title: 'MINT rules',
  order: 3,
};

export default function MintRules() {
  return (
    <Page>
      <PageHeader
        kicker="Rules"
        title="Rules for MINT (the extraction tool)"
        lead="MINT generates client/deployment copies of HIVE services and swaps internal-only pieces for shippable ones. It is proprietary and lives in /MINT (its own private repo; gitignored from the platform)."
      />

      <Callout kind="danger" title="Coordinate first">
        Do not run MINT, change its behavior, or ship an extraction without coordinating
        with the maintainer first.
      </Callout>

      <Section title="The rules">
        <ol>
          <li>
            <strong>Do not run MINT or ship an extraction without coordinating first.</strong>{' '}
            Real adapters (project-graph resolver, file writer, signed-token auth, persistent
            audit, the install/typecheck/boot gate) are wired only when services exist.
          </li>
          <li>
            <strong>Keep secret-sauce out of extractions.</strong> Internal-only strategies
            (e.g. the range-reservation id allocator) must be swapped for the shippable
            equivalent (the gap-free counter allocator) via the swap registry — never shipped
            as-is.
          </li>
          <li>
            <strong>Transforms stay pure.</strong> MINT operates on an in-memory{' '}
            <C>ProjectPlan</C>; keep new capability modules and modes as pure plan→plan
            functions so they're testable without disk or a live build.
          </li>
          <li>
            <strong>Don't change the frozen pipeline order.</strong> The <C>Extractor</C> steps
            (authorize → audit → resolve → mode → capabilities → write → gate → audit) are
            fixed; add behavior via capability modules/modes, not by editing the pipeline.
          </li>
          <li>
            <strong>Fail closed.</strong> Unknown module, unauthorized operator, or a failed
            post-gen gate must abort and be audited — never produce a partial/insecure copy.
          </li>
          <li>
            <strong>Never commit MINT with the platform.</strong> It must remain in{' '}
            <C>.gitignore</C>.
          </li>
        </ol>
        <Mermaid
          caption="The frozen order is the rule: never reorder it; extend via modules and the swap registry."
          chart={`
flowchart LR
    A["authorize"] --> AU1["audit begin"] --> R["resolve"] --> MODE["mode"]
    MODE --> CAP["capabilities"] --> W["write"] --> G["gate"] --> AU2["audit complete"]
`}
        />
      </Section>

      <Section title="Who to contact">
        <p>
          To use MINT, request an extraction, or extend it (new capability module, new silo
          transform), contact the maintainer: <strong>abdul29112004@gmail.com</strong>.
        </p>
      </Section>

      <NextSteps>
        <Card icon="📦" title="MINT overview" to="about/mint">
          What MINT is, in plain words.
        </Card>
        <Card icon="🪄" title="How MINT works" to="about/how-mint-works">
          The deep-dive walkthrough.
        </Card>
      </NextSteps>

      <p className="contact">
        Questions? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
