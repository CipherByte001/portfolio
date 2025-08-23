// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/portfolio/' // repo name (case‑sensitive)
  // (no outDir: Vite will build to /dist by default)
})
