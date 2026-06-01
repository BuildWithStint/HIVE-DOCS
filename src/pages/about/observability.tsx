import {
  Page,
  PageHeader,
  Section,
  Callout,
  CodeBlock,
  C,
  NextSteps,
  Card,
} from '../../components/ui';
import { Mermaid } from '../../components/Mermaid';

export const meta = {
  group: 'about',
  file: 'observability',
  title: 'observability',
  order: 9.5,
};

export default function Observability() {
  return (
    <Page>
      <PageHeader
        kicker="Layer · @hive/observability"
        title="observability — logging & metrics"
        lead="Structured logging and metrics that automatically include the current tenant and request, so you can trace what happened and for whom."
      />

      <Section title="Why it exists">
        <p>
          In a multi-tenant system, a log line like "created task" is useless without "for
          which org / request". This package attaches that context for you and keeps the
          logging/metrics backend swappable.
        </p>
        <Mermaid
          caption="The tenant-aware wrapper pulls orgId / userId / requestId from context automatically."
          chart={`
flowchart LR
    CODE["business code<br/>log.info('task created')"] --> TAL["TenantAwareLogger"]
    ALS[("tenant-context<br/>orgId, userId, requestId")] -.-> TAL
    TAL --> SL["StructuredLogger"]
    SL --> SINK["injected sink<br/><small>stdout / real transport</small>"]
`}
        />
      </Section>

      <Section title="How it's built">
        <ul>
          <li>
            <C>Logger</C> — the interface business code uses (<C>debug/info/warn/error/child</C>).
            Never call <C>console.*</C> directly; log through this.
          </li>
          <li>
            <C>StructuredLogger</C> — emits one JSON object per line to an{' '}
            <strong>injected</strong> sink (default stdout/stderr). Supports level filtering
            and <C>child(fields)</C> to bind fields once.
          </li>
          <li>
            <C>TenantAwareLogger</C> — a wrapper that automatically adds <C>orgId</C>,{' '}
            <C>userId</C>, and <C>requestId</C> from tenant-context to every line. Outside a
            request it's a transparent pass-through. Explicit fields you pass still win.
          </li>
          <li>
            <C>Metrics</C> — <C>increment</C> / <C>gauge</C> / <C>timing</C>. The default{' '}
            <C>NoopMetrics</C> makes metrics free to call everywhere; swap in a real backend
            (StatsD, Prometheus) at startup. <C>timed(metrics, name, fn)</C> measures a
            function (records even on failure).
          </li>
        </ul>
      </Section>

      <Section title="How to use it">
        <CodeBlock
          lang="ts"
          code={`const log = new TenantAwareLogger(new StructuredLogger());
log.info('task created', { taskId: 42 });
// -> {"level":"info","message":"task created","fields":{"orgId":"...","taskId":42}}`}
        />
      </Section>

      <Section title="How to extend it">
        <ul>
          <li>
            <strong>Real log transport / metrics backend</strong>: implement the sink /{' '}
            <C>Metrics</C> interface and inject it at startup. Don't import a logging library
            into business code.
          </li>
          <li>
            <strong>Tracing</strong> (spans) is intentionally not built yet — add a{' '}
            <C>Tracer</C> port when a service needs distributed tracing.
          </li>
        </ul>
      </Section>

      <Section title="Gotchas">
        <Callout kind="warn">
          Tenant fields come only from tenant-context — don't pass <C>orgId</C> into the
          logger constructor by hand.
        </Callout>
      </Section>

      <NextSteps>
        <Card icon="🪪" title="tenant-context" to="about/tenant-context">
          Where the fields come from.
        </Card>
        <Card icon="🚦" title="middleware" to="about/middleware">
          requestContext sets the requestId.
        </Card>
      </NextSteps>

      <p className="contact">
        Questions? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
