import { defineConfig } from 'vite'
export default defineConfig({ base: process.env.VITE_BASE_PATH || '/', build: { outDir: 'dist', target: 'esnext' } })
