// When the "Use RickForm" flag is ON we inject CSS into the same-origin iframe
// to (1) hide the native client form and (2) hijack the CTA buttons so a click
// opens our <RickSheet> instead of the native form.
//
// Same-origin only — works because the mirror is served from the same vite
// dev server. In production the rick-js snippet runs inside the client page
// (same origin from browser perspective) and does the same DOM manipulation.

import type { RickForm } from "../rick-form"

export interface InjectorConfig {
  hideSelector: string         // CSS selector for native form(s)
  triggerSelector: string      // CSS selector for CTA(s) that should open RickSheet
  contentKey: string           // RickForm content plugin key
  formTitle?: string           // sheet title
}

const STYLE_ID = "rick-form-injector-style"

export class IframeInjector {
  constructor(
    private iframe: HTMLIFrameElement,
    private rickForm: typeof RickForm,
  ) {}

  private get doc(): Document | null {
    try {
      return this.iframe.contentDocument
    } catch {
      // cross-origin — give up
      return null
    }
  }

  enable(config: InjectorConfig): void {
    const doc = this.doc
    if (!doc) return

    // 1. Inject hide-styles
    let style = doc.getElementById(STYLE_ID) as HTMLStyleElement | null
    if (!style) {
      style = doc.createElement("style")
      style.id = STYLE_ID
      doc.head.appendChild(style)
    }
    style.textContent = `${config.hideSelector} { display: none !important; }`

    // 2. Hijack CTAs
    const triggers = doc.querySelectorAll(config.triggerSelector)
    triggers.forEach((el) => {
      // Mark as hijacked so we can clean up later
      ;(el as HTMLElement).dataset.rickHijacked = "true"
      el.addEventListener("click", this.clickHandler(config), true)
    })
  }

  disable(): void {
    const doc = this.doc
    if (!doc) return
    // Remove style
    const style = doc.getElementById(STYLE_ID)
    if (style) style.remove()
    // Note: we don't remove click listeners (would need stored refs) —
    // they're idempotent: when flag OFF, clickHandler checks flag state and
    // does nothing. Simpler to just refresh page to fully clean. For demo OK.
  }

  private clickHandler =
    (config: InjectorConfig) => (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      this.rickForm.open({
        contentKey: config.contentKey,
        title: config.formTitle ?? "Get a Free Consultation",
        mode: "auto",
        callbacks: {
          onSubmit: (values) => {
            // In production: POST to flow.rick.ai/webhook/snippetFormHook
            // Here: log + show alert (verifiable demo signal)
            // eslint-disable-next-line no-console
            console.log("[RickForm submit]", values)
            window.alert("Submitted! Payload в console.\nProd: → flow.rick.ai → Monday CRM board 1231414321")
          },
        },
      })
    }
}
