// IIFE entry point — exposes window.RickForm + window.RickSheet (alias).
// Bundled as public/rick-form.js, served from Vercel CDN, loaded via:
//   <script src="https://rick-js-form-bottom-sheet.vercel.app/rick-form.js" async></script>
import { RickForm } from "./rick-form"

// Eagerly import all content plugins so their RickFormRegistry.register(...)
// side effects run at bundle load.
import "./content/typhoon-contact-form-2026-05-11"

declare global {
  interface Window {
    RickForm: typeof RickForm
    RickSheet: typeof RickForm // alias — same public API
  }
}

window.RickForm = RickForm
window.RickSheet = RickForm

// Optional auto-fire: if window.rickFormQueue exists (set by add_code rule before
// bundle loaded), drain it now.
const queue = (window as unknown as { rickFormQueue?: unknown[] }).rickFormQueue
if (Array.isArray(queue)) {
  queue.forEach((item) => {
    try {
      if (item && typeof item === "object" && "open" in item) {
        RickForm.open((item as { open: Parameters<typeof RickForm.open>[0] }).open)
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[RickForm] queued open failed:", err)
    }
  })
}
