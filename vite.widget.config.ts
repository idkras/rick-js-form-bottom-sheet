import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js"
import { resolve } from "path"

// Bundles the widget as a single IIFE file `public/rick-form.js`.
// CSS is inlined into the JS so a single <script src="..."> tag is enough.
export default defineConfig({
  plugins: [react(), cssInjectedByJsPlugin()],
  publicDir: false,
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/standalone.tsx"),
      name: "_RickFormModule",
      formats: ["iife"],
      fileName: () => "rick-form.js",
    },
    outDir: "public",
    emptyOutDir: false,
    minify: true,
    sourcemap: false,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
})
