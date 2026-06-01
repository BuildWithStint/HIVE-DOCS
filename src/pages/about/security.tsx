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
  file: 'security',
  title: 'security',
  order: 8,
};

export default function Security() {
  return (
    <Page>
      <PageHeader
        kicker="Layer · @hive/security"
        title="security — authentication & authorization"
        lead="The building blocks for &quot;is this request allowed?&quot;: verifying the access token (authentication) and checking roles/permissions (authorization)."
      />

      <Section title="Why it exists">
        <p>
          Identity and the tenant (<C>orgId</C>) must come from a{' '}
          <strong>trusted, signed token</strong>, not from client-set headers or body.
          This package establishes that trust and exposes small Express middlewares to
          enforce it.
        </p>
        <Mermaid
          caption="Trust flows from the signed token only. Headers and body are never trusted for identity."
          chart={`
flowchart LR
    TOK["Authorization: Bearer …"] --> V{{"TokenVerifier.verify()"}}
    V -->|valid| C["req.auth = claims<br/><small>sub, orgId, roles, permissions</small>"]
    V -->|bad / expired| E401["401 Unauthorized"]
    C --> A{{"authorize('billing:write')"}}
    A -->|has it| OK["handler runs"]
    A -->|missing| E403["403 Forbidden"]
`}
        />
      </Section>

      <Section title="How it's built">
        <Table
          head={['Piece', 'What it is']}
          rows={[
            [<C>AuthClaims</C>, <>What a verified token contains: <C>sub</C> (user id), optional <C>orgId</C>, <C>roles</C>, <C>permissions</C>.</>],
            [<C>TokenVerifier</C>, <>An <strong>injected interface</strong> (<C>verify(token) → claims</C>). The platform does <strong>not</strong> hard-code a JWT library; each service plugs in a real verifier. It must <strong>reject</strong> bad/expired/malformed tokens so we fail closed.</>],
            [<C>authenticate(verifier)</C>, <>Reads the <C>Authorization: Bearer …</C> header (case-insensitive), verifies it, and puts the claims on <C>req.auth</C>. Missing/bad token → 401.</>],
            [<C>authorize(...required)</C>, <>Checks the request has the required permissions (or roles). Requires <strong>all</strong> of them. No auth → 401; missing a permission → 403.</>],
            [<><C>HttpError</C>, <C>UnauthorizedError</C> (401), <C>ForbiddenError</C> (403)</>, 'Typed errors the central error handler turns into clean responses.'],
          ]}
        />
      </Section>

      <Section title="How to use it">
        <CodeBlock
          lang="ts"
          code={`app.use(authenticate(myVerifier));
router.post('/invoices', authorize('billing:write'), createInvoice);`}
        />
      </Section>

      <Section title="How to extend it">
        <ul>
          <li>
            <strong>Real tokens</strong>: implement <C>TokenVerifier</C> in your service
            and inject it.
          </li>
          <li>
            <strong>New gate</strong> (e.g. validate request body, rate-limit): these are
            planned "Tier-2" middlewares; add them as small functions that fail closed and
            forward errors via <C>next(err)</C>.
          </li>
        </ul>
      </Section>

      <Section title="Gotchas">
        <Callout kind="danger">
          Never trust <C>orgId</C> from headers/body — only from verified claims. Always
          forward errors to <C>next(err)</C> so the error handler formats them.
        </Callout>
      </Section>

      <NextSteps>
        <Card icon="🚦" title="middleware" to="about/middleware">
          How these plug into the core pipeline.
        </Card>
        <Card icon="🪪" title="tenant-context" to="about/tenant-context">
          Where the verified orgId is parked.
        </Card>
      </NextSteps>

      <p className="contact">
        Questions? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
