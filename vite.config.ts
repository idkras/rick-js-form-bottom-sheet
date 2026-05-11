import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "path"

// Dev server / demo build (npm run dev / npm run build:demo).
// For widget IIFE bundle see vite.widget.config.ts.
export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    port: 4020,
  },
})
