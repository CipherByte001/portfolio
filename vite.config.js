import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/portfolio/',         // <-- must match repo name exactly (case sensitive)
  build: { outDir: 'docs' },   // <-- GitHub Pages serves /docs on your branch
})
