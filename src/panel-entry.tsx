// Standalone entry — injected into typhoon.coffee HTML by vite middleware.
// Mounts our React panel into the pre-injected `<div id="rick-form-overlay">`.
// No `<App>` iframe wrapper — typhoon site IS the document, our panel sits on top.
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { OverlayApp } from "./overlay-app"
import { RickForm } from "./rick-form"

// Expose RickForm globally so production `add_code` rule + console debugging
// can call `window.RickForm.open({...})` without bundle imports.
declare global {
  interface Window {
    RickForm: typeof RickForm
  }
}
window.RickForm = RickForm

// Wait for DOM ready (script may run before injected div if user opens via deep link)
function mount() {
  const el = document.getElementById("rick-form-overlay")
  if (!el) {
    // eslint-disable-next-line no-console
    console.warn("[RickForm] #rick-form-overlay not found; check vite middleware injection")
    return
  }
  createRoot(el).render(
    <StrictMode>
      <OverlayApp />
    </StrictMode>,
  )
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount, { once: true })
} else {
  mount()
}
