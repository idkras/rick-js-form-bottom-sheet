// DocumentInjector — targets `document` directly (DOM-mount mode where
// typhoon page IS our document via vite middleware proxy, no iframe).
import type { RickForm } from "../rick-form"

// Harvest 10 canonical rick_* attribution fields from cookies + UTM for
// payload sent to flow.rick.ai/webhook/snippetFormHook.
// Reference: skill 4-rick-js-bridge-create-and-deploy §Step 3.
function harvestRickFields(): Record<string, string> {
  const cookies: Record<string, string> = {}
  document.cookie.split(/;\s*/).forEach((c) => {
    const [k, ...rest] = c.split("=")
    if (k) cookies[k] = decodeURIComponent(rest.join("=") || "")
  })
  const url = new URL(window.location.href)
  const utm = (k: string) => url.searchParams.get(k) || ""
  return {
    rick_ga_clientid: cookies._ga || "",
    rick_ym_clientid: cookies._ym_uid || "",
    rick_rid: cookies.rick_rid || "",
    rick_url: window.location.href,
    rick_temp_deal_id: crypto.randomUUID?.() || `tmp_${Date.now()}`,
    rick_deal_method: "rick_form_bottom_sheet",
    rick_campaign_attribution: utm("utm_source") || cookies.utm_source || "",
    rick_ad_channel_identifiers: utm("gclid") || utm("yclid") || utm("fbclid") || "",
    rick_ad_identifiers: utm("utm_campaign") || cookies.utm_campaign || "",
    rick_additional_campaign_data: JSON.stringify({
      utm_medium: utm("utm_medium"),
      utm_term: utm("utm_term"),
      utm_content: utm("utm_content"),
      referrer: document.referrer || "",
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    }),
  }
}

export interface InjectorConfig {
  hideSelector: string
  triggerSelector: string
  contentKey: string
  formTitle?: string
}

const STYLE_ID = "rick-form-injector-style"
const HIJACK_ATTR = "data-rick-hijacked"

export class DocumentInjector {
  private clickHandlerRef?: (e: Event) => void

  constructor(
    private doc: Document,
    private rickForm: typeof RickForm,
  ) {}

  enable(config: InjectorConfig): void {
    // 1. Hide native form via injected style
    let style = this.doc.getElementById(STYLE_ID) as HTMLStyleElement | null
    if (!style) {
      style = this.doc.createElement("style")
      style.id = STYLE_ID
      this.doc.head.appendChild(style)
    }
    style.textContent = `${config.hideSelector} { display: none !important; }`

    // 2. Hijack CTA clicks via document-level capture handler
    if (this.clickHandlerRef) {
      this.doc.removeEventListener("click", this.clickHandlerRef, true)
    }
    this.clickHandlerRef = (e: Event) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      // Skip clicks inside our overlay
      if (target.closest("#rick-form-overlay")) return
      const triggerEl = target.closest(config.triggerSelector)
      if (!triggerEl) return
      // Block typhoon's native handlers — they may also listen at document
      // capture phase (`.js-recall-popup-call` opens their Anna popup).
      // stopImmediatePropagation prevents any other listener on the same
      // element/phase from firing after ours.
      e.preventDefault()
      e.stopPropagation()
      ;(e as Event & { stopImmediatePropagation: () => void }).stopImmediatePropagation()
      this.rickForm.open({
        contentKey: config.contentKey,
        title: config.formTitle ?? "Get a Free Consultation",
        mode: "auto",
        callbacks: {
          onSubmit: (values) => {
            // eslint-disable-next-line no-console
            console.log("[RickForm submit]", values)
            // Real POST to flow.rick.ai webhook (per skill 4-rick-js-bridge-create-and-deploy).
            // 10 canonical rick_* attribution fields harvested from cookies/UTM.
            const harvest = harvestRickFields()
            const payload = { ...values, ...harvest, form_name: "typhoon-contact-form-2026-05-11" }
            fetch("https://flow.rick.ai/webhook/snippetFormHook", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
              keepalive: true,
            })
              .then((r) =>
                // eslint-disable-next-line no-console
                console.log(`[RickForm webhook] ${r.status} ${r.statusText}`),
              )
              .catch((err) =>
                // eslint-disable-next-line no-console
                console.error("[RickForm webhook] failed:", err),
              )
          },
        },
      })
    }
    this.doc.addEventListener("click", this.clickHandlerRef, true)
  }

  disable(): void {
    const style = this.doc.getElementById(STYLE_ID)
    if (style) style.remove()
    if (this.clickHandlerRef) {
      this.doc.removeEventListener("click", this.clickHandlerRef, true)
      this.clickHandlerRef = undefined
    }
  }
}
