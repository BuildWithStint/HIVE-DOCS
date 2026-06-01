import {
  Page,
  PageHeader,
  Section,
  Callout,
  CodeBlock,
  Table,
  C,
  NextSteps,
  Card,
} from '../../components/ui';
import { Mermaid } from '../../components/Mermaid';

export const meta = {
  group: 'about',
  file: 'models-common',
  title: 'models-common',
  order: 9,
};

export default function ModelsCommon() {
  return (
    <Page>
      <PageHeader
        kicker="Layer · @hive/models-common"
        title="models-common — shared entities & index helpers"
        lead="The common, reusable data shapes every service can use: User, Org, and the RBAC tables — plus helpers for building tenant-safe indexes."
      />

      <Section title="Why it exists">
        <p>
          Some tables (like users and orgs) are shared platform concepts. Defining them
          once avoids copy-paste and guarantees they all follow the same conventions
          (BIGINT id, <C>orgId</C>, audit timestamps, soft delete).
        </p>
        <Mermaid
          caption="Everything inherits from BaseEntity, so the full convention set comes for free."
          chart={`
flowchart TD
    E["Entity<br/><small>id + orgId</small>"] --> BE["BaseEntity"]
    AF["AuditFields<br/><small>createdAt, updatedAt, deletedAt</small>"] --> BE
    BE --> ORG["Org"]
    BE --> USER["User"]
    BE --> RBAC["Permission / Role / RolePermission / UserRole"]
`}
        />
      </Section>

      <Section title="How it's built">
        <Table
          head={['Piece', 'What it is']}
          rows={[
            [<C>BaseEntity</C>, <><C>Entity</C> (<C>id</C> + <C>orgId</C>) + <C>AuditFields</C> (<C>createdAt, updatedAt, deletedAt</C>). Every entity extends this — convention by inheritance, never copy-paste.</>],
            [<C>tenantIndex(fields, unique?)</C>, <>Builds an index spec that <strong>always puts <C>orgId</C> first</strong>. Tenant queries filter by <C>orgId</C>, so it must lead every index. Also removes a duplicate <C>orgId</C> if you listed it.</>],
            [<C>Org</C>, 'name, slug, active — with a per-tenant unique slug.'],
            [<C>User</C>, 'email, name, active — with a per-tenant unique email.'],
            [<>RBAC: <C>Permission</C>, <C>Role</C>, <C>RolePermission</C>, <C>UserRole</C></>, 'Normalized join tables with their indexes.'],
          ]}
        />
      </Section>

      <Section title="How to extend it">
        <ul>
          <li>
            <strong>New shared entity?</strong> Create an interface that{' '}
            <C>extends BaseEntity</C>, then export an <C>*_INDEXES</C> array built with{' '}
            <C>tenantIndex(...)</C>.
          </li>
          <li>
            <strong>Service-specific entity?</strong> Put it in the service, not here. This
            package is only for things many services share.
          </li>
        </ul>
        <CodeBlock
          lang="ts"
          code={`export interface Project extends BaseEntity {
  name: string;
  active: boolean;
}

export const PROJECT_INDEXES = [
  tenantIndex(['name'], true), // → orgId-leading, unique per tenant
];`}
        />
      </Section>

      <Section title="Gotchas">
        <Callout kind="warn">
          Always build indexes with <C>tenantIndex</C> so <C>orgId</C> leads — don't
          hand-write index specs that start with a business field.
        </Callout>
      </Section>

      <NextSteps>
        <Card icon="🧬" title="schema" to="about/schema">
          Generate tables from these shapes.
        </Card>
        <Card icon="🧱" title="dal-core" to="about/dal-core">
          The Entity contract these extend.
        </Card>
      </NextSteps>

      <p className="contact">
        Questions? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
