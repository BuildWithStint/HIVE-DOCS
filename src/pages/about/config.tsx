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
  file: 'config',
  title: 'config',
  order: 2,
};

export default function Config() {
  return (
    <Page>
      <PageHeader
        kicker="Layer · @hive/config"
        title="config — layered constants & secrets"
        lead="One place to read configuration from several files plus the real environment, merged with a clear order of priority."
      />

      <Section title="Why it exists">
        <p>
          Different settings belong in different places: platform-wide defaults
          (committed), per-service values (committed next to the service), and local
          secrets (never committed). This layer combines them and gives typed, fail-closed
          access.
        </p>
        <Mermaid
          caption="Four layers, lowest priority first. Later layers override earlier ones; real env vars always win."
          chart={`
flowchart LR
    H["hive.properties<br/><small>platform defaults · committed</small>"] --> S["service.properties<br/><small>per-service · committed</small>"]
    S --> E["env.local<br/><small>secrets · GITIGNORED</small>"]
    E --> P["process.env<br/><small>real env · WINS</small>"]
`}
        />
      </Section>

      <Section title="How it's built">
        <ul>
          <li>
            <C>loadConfig(&#123; rootDir?, serviceDir?, env? &#125;)</C> → a <C>Config</C>.
            All inputs optional, which makes it fully testable.
          </li>
          <li>
            <C>Config</C> is immutable with typed getters: <C>getString(key, fallback?)</C>,{' '}
            <C>getRequired(key)</C> (throws if missing/empty), <C>getNumber(...)</C>,{' '}
            <C>getBoolean(...)</C> (throw on un-coercible values), <C>has(key)</C>,{' '}
            <C>toObject()</C>.
          </li>
          <li>
            <C>parseProperties(text)</C> — a tiny self-contained parser (no <C>dotenv</C>{' '}
            dependency): <C>key=value</C> or <C>key: value</C>, <C>#</C>/<C>!</C> comments,
            optional quotes, escapes inside double quotes.
          </li>
        </ul>
        <Callout kind="key">
          Files are <strong>optional</strong> (a missing file is fine), but{' '}
          <strong>required keys fail closed</strong> — <C>getRequired('MONGO_URL')</C>{' '}
          throws if it isn't set.
        </Callout>
      </Section>

      <Section title="How to use it">
        <CodeBlock
          lang="ts"
          code={`const config = loadConfig({ serviceDir: __dirname });
const port  = config.getNumber('service.http.port', 4010);
const dbUrl = config.getRequired('MONGO_URL'); // from env.local / process.env`}
        />
      </Section>

      <Section title="How to extend it">
        <ul>
          <li>
            <strong>New service constant?</strong> Add it to that service's{' '}
            <C>service.properties</C>.
          </li>
          <li>
            <strong>New platform-wide default?</strong> Add it to <C>hive.properties</C>.
          </li>
          <li>
            <strong>New secret?</strong> Add it to <C>env.local</C> (and document it in{' '}
            <C>env.local.example</C>). Never commit secrets.
          </li>
        </ul>
      </Section>

      <Section title="Gotchas">
        <Callout kind="warn">
          <C>env.local</C> is gitignored on purpose. Copy <C>env.local.example</C> to
          start. Real environment variables always win over files.
        </Callout>
      </Section>

      <NextSteps>
        <Card icon="🚀" title="Getting started" to="docs/getting-started">
          See the config layering in the setup flow.
        </Card>
        <Card icon="🧩" title="Sample service" to="about/sample-tasks-service">
          A real service that loads config.
        </Card>
      </NextSteps>

      <p className="contact">
        Questions? Email <strong>abdul29112004@gmail.com</strong>.
      </p>
    </Page>
  );
}
