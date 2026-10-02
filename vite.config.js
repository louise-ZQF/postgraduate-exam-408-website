import { defineConfig } from 'vite'
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  define: { __CONTENT_VERSION__: JSON.stringify(process.env.GITHUB_SHA || new Date().toISOString()) },
  build: { outDir: 'dist', target: 'esnext' },
})
