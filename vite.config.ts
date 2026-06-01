import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// The portal lives in HIVE/portal. The docs it renders (about/, rules/, docs/,
// MINT/) live one level up in the repo root, so the dev server must be allowed
// to read from there.
const repoRoot = resolve(__dirname, '..');

// MINT is internal/proprietary. In production builds we replace every page
// module under src/pages/mint/ with an empty stub so the code is never shipped
// to a public deploy. Local dev (and VITE_INCLUDE_MINT=true) keep them.
function excludeMintPages(includeMint: boolean) {
  const stub = 'export const meta = undefined;\nexport default function MintExcluded() { return null; }\n';
  return {
    name: 'hive-exclude-mint-pages',
    apply: 'build' as const,
    enforce: 'pre' as const,
    transform(_code: string, id: string) {
      if (includeMint) return null;
      const normalized = id.split('\\').join('/');
      if (/\/src\/pages\/mint\/[^/]+\.tsx$/.test(normalized)) {
        return { code: stub, map: null };
      }
      return null;
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const includeMint = mode !== 'production' || process.env.VITE_INCLUDE_MINT === 'true';
  return {
    plugins: [react(), excludeMintPages(includeMint)],
    server: {
      port: 7777,
      fs: {
        // Allow importing the markdown files that live in the repo root.
        allow: [repoRoot],
      },
    },
  };
});

