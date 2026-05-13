import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "path"

// Dev server with proxy for whole typhoon.coffee site (per owner directive
// 2026-05-13: «лучше сайт проксировать чтобы не ебаться с iframe»).
//
// All requests except `/_panel/*` and `/src/*` and `/@*` (vite internals) get
// proxied to https://typhoon.coffee — the iframe loads `/contacts/` which
// hits the proxy → typhoon CDN → returns full HTML/CSS/JS as if same-origin.
//
// CSS injection + CTA hijack work because iframe content is now same-origin.
//
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
    proxy: {
      "/typhoon": {
        target: "https://typhoon.coffee",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/typhoon/, ""),
        configure: (proxy) => {
          proxy.on("proxyRes", (proxyRes) => {
            // Strip security headers that block iframe + CSS injection
            delete proxyRes.headers["x-frame-options"]
            delete proxyRes.headers["content-security-policy"]
            delete proxyRes.headers["content-security-policy-report-only"]
            // Cookies should be set on our origin
            const setCookie = proxyRes.headers["set-cookie"]
            if (Array.isArray(setCookie)) {
              proxyRes.headers["set-cookie"] = setCookie.map((c) =>
                c.replace(/;\s*Secure/gi, "").replace(/;\s*Domain=[^;]+/gi, ""),
              )
            }
          })
        },
      },
    },
  },
})
