// Demo page (экран Влада-style) — npm run dev / npm run build:demo.
// Dark shell, mobile-first configurator, "Open form" button opens <RickSheet>.
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { DemoApp } from "./demo-app"

const el = document.getElementById("root")
if (el) {
  createRoot(el).render(
    <StrictMode>
      <DemoApp />
    </StrictMode>,
  )
}
