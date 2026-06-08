import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2020',
  splitting: false,
  treeshake: true,
  external: [
    'better-sqlite3',
    'next',
    'next/server',
    'react',
    'react-dom',
    '@simplewebauthn/browser',
  ],
});
