import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // IMPORTANT: your repo name here (case‑sensitive)
  base: '/portfolio/',
  // Build into /docs so GitHub Pages can serve it
  build: { outDir: 'docs' },
})