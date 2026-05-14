import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "path"

// Per owner directive 2026-05-13: «не в iframe, а просто монтирование сайта в dom model».
// This plugin makes vite dev server BEHAVE LIKE typhoon.coffee:
//  - GET /  → fetch typhoon.coffee homepage HTML, strip CSP/XFO, inject our
//    `<div id="rick-form-overlay">` + `<script type="module" src="/src/panel-entry.tsx">`
//    before </body>, return modified HTML.
//  - GET /contacts/, /products/, /about-us/, etc. → same proxy + inject.
//  - GET /wp-content/, /wp-includes/, /wp-json/, image/font/css → proxy as-is.
//  - GET /src/*, /@vite/*, /@react-refresh, /node_modules/* → vite handles natively.
// Result: browser sees ONE document — typhoon.coffee body + our React panel mounted
// as overlay. No iframe at all.

function typhoonProxyPlugin(): Plugin {
  const TARGET = "https://typhoon.coffee"
  // Bypass for vite internals + our app entry
  const VITE_INTERNAL = /^\/(@|src\/|node_modules\/|__vite|\.vite\/)/

  return {
    name: "typhoon-proxy-dom-mount",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const reqUrl = req.url || "/"
        if (VITE_INTERNAL.test(reqUrl)) return next()
        // Skip dev `/index.html` so vite dev tooling still works
        if (reqUrl === "/index.html") return next()

        const targetUrl = `${TARGET}${reqUrl}`
        try {
          const upstream = await fetch(targetUrl, {
            headers: {
              "user-agent":
                (req.headers["user-agent"] as string) ||
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
              "accept-language": "en-US,en;q=0.9",
            },
            redirect: "follow",
          })

          const ct = upstream.headers.get("content-type") || ""
          const status = upstream.status

          // Forward + strip dangerous headers
          upstream.headers.forEach((v, k) => {
            const lk = k.toLowerCase()
            if (
              lk === "x-frame-options" ||
              lk === "content-security-policy" ||
              lk === "content-security-policy-report-only" ||
              lk === "content-encoding" ||
              lk === "content-length" ||
              lk === "transfer-encoding"
            ) return
            res.setHeader(k, v)
          })

          if (ct.includes("text/html")) {
            let html = await upstream.text()
            // Strip in-document CSP meta
            html = html.replace(
              /<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi,
              "",
            )
            // Inject @vitejs/plugin-react preamble in <head> (REQUIRED for React Fast Refresh)
            const reactPreamble = `\n<script type="module">
import RefreshRuntime from "/@react-refresh"
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true
</script>\n`
            if (html.includes("</head>")) {
              html = html.replace("</head>", reactPreamble + "</head>")
            } else {
              // No </head> — prepend at start of body
              html = reactPreamble + html
            }
            // Inject overlay container + React entry before </body>
            const inject =
              `\n  <!-- RickForm overlay injected by vite proxy -->\n` +
              `  <div id="rick-form-overlay" data-no-quad></div>\n` +
              `  <script type="module" src="/src/panel-entry.tsx"></script>\n`
            if (html.includes("</body>")) {
              html = html.replace("</body>", inject + "</body>")
            } else {
              html += inject
            }
            res.setHeader("content-type", "text/html; charset=utf-8")
            res.statusCode = status
            res.end(html)
          } else {
            // Pass through binary / css / js content
            const buf = Buffer.from(await upstream.arrayBuffer())
            res.statusCode = status
            res.end(buf)
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("[typhoon-proxy] upstream error:", err, "for", targetUrl)
          next()
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), typhoonProxyPlugin()],
  css: { modules: { localsConvention: "camelCase" } },
  resolve: { alias: { "@": resolve(__dirname, "src") } },
  server: { port: 4020 },
})
