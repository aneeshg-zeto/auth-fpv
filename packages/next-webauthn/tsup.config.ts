import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: { index: 'src/server/index.ts' },
    outDir: 'dist/server',
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    external: ['react', 'react-dom', 'next', 'better-sqlite3'],
  },
  {
    entry: { index: 'src/client/index.ts' },
    outDir: 'dist/client',
    format: ['cjs', 'esm'],
    dts: true,
    external: ['react', 'react-dom', 'next'],
  },
])
