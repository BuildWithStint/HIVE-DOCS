import {
  Page,
  PageHeader,
  Section,
  Callout,
  Table,
  FileTree,
  C,
  DocLink,
  NextSteps,
  Card,
} from '../../components/ui';
import { Mermaid } from '../../components/Mermaid';

export const meta = {
  group: 'about',
  file: 'catalog-service',
  title: 'catalog service',
  order: 3,
};

export default function CatalogService() {
  return (
    <Page>
      <PageHeader
        kicker="Concepts & Layers · apps/catalog"
        title="catalog — a thin service, everything working together"
        lead="A small, runnable multi-tenant service under apps/catalog. It owns only what is service-specific: its queries, its db type, and its tenancy decision. Everything generic comes from @hive/connection and @hive/dal."
      />

      <Section title="What lives in the service (and what doesn't)">
        <Table
          head={['In the service', 'Borrowed from a package']}
          rows={[
            [<>Tenancy via <C>AsyncLocalStorage</C> (<C>src/lib/tenancy</C>)</>, <>The env + DB clients (<DocLink to="about/connection">@hive/connection</DocLink>)</>],
            [<>The request pipeline (<C>src/lib/middleware</C>)</>, <>The query language + adapters (<DocLink to="about/dal">@hive/dal</DocLink>)</>],
            [<>The routes + the one DAL wiring (<C>make-repository.ts</C>)</>, <>The <C>Repository</C> + <C>createAdapter</C> factory</>],
          ]}
        />
        <FileTree
          title="apps/catalog/src"
          nodes={[
            { name: 'main.ts', note: 'boot: set HIVE_SERVICE_DIR, port, shutdown' },
            { name: 'app.ts', note: 'json → timer → /health → core pipeline → routes → errors' },
            {
              name: 'lib',
              children: [
                { name: 'tenancy/', note: 'AsyncLocalStorage: runWithTenant, currentOrgId' },
                { name: 'middleware/', note: 'token → tenant → request id → errorHandler' },
                { name: 'http/', note: 'routes' },
                {
                  name: 'dal',
                  children: [
                    {
                      name: 'make-repository.ts',
                      note: 'the ONLY DAL wiring (query + db type + tenancy)',
                    },
                  ],
                },
              ],
            },
          ]}
        />
      </Section>

      <Section title="The one wiring decision">
        <p>
          <C>make-repository.ts</C> is where the service picks its db type and decides
          tenancy. It is marked <C>@mintable</C> so MINT can rewrite it: the{' '}
          <strong>pooled</strong> build passes <C>currentOrgId</C> (every query is
          org-scoped); a <strong>silo</strong> extract strips that and runs unscoped for
          one tenant.
        </p>
        <Mermaid
          caption="The request pipeline establishes the tenant; make-repository wires the one adapter; @hive/dal does the rest."
          chart={`
flowchart TD
    REQ([HTTP request]) --> MW["middleware<br/><small>verify token → set current orgId</small>"]
    MW --> ROUTES["routes<br/><small>normal business code</small>"]
    ROUTES --> MR["make-repository<br/><small>pick db type + tenancy</small>"]
    MR --> DAL["@hive/dal Repository + adapter"]
    DAL --> DB[("one shared DB<br/>rows tagged by orgId")]
`}
        />
      </Section>

      <Callout kind="key" title="Where orgId comes from">
        The <C>orgId</C> is read from the verified token by the pipeline and parked on
        the per-request notepad (<C>AsyncLocalStorage</C>). Routes never set it; in the
        pooled build the repository reads it automatically for every query.
      </Callout>

      <NextSteps>
        <Card icon="🗂️" title="dal" to="about/dal">
          The query language + adapters the service uses.
        </Card>
        <Card icon="🌊" title="How data flows" to="about/how-data-flows">
          A request from arrival to database and back.
        </Card>
      </NextSteps>
    </Page>
  );
}
