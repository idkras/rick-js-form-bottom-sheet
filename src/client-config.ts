// Multi-client config registry — single source of truth for which client config
// to use on each host. Adding a new client = add entry here + register content
// plugin in src/content/. No edits to overlay-app.tsx required (Generalization-
// first gate, AGENTS.md §Generalization-first gate).
//
// Detection priority:
//   1. `<div id="rick-form-overlay" data-rick-client="...">` (explicit override)
//   2. window.location.hostname (production)
//   3. URL search param `?rickClient=...` (preview/qa)
//   4. fallback: first entry in CLIENTS array

import type { InjectorConfig } from "./feature-flag/document-injector"

export interface ClientConfig {
  /** Canonical client slug, kebab-case domain (e.g. "typhoon-coffee") */
  client: string
  /** Bead/epic id for project tracking */
  epicId: string
  /** Hostnames that should auto-select this client. RegExp source string. */
  hostMatch: string[]
  injector: InjectorConfig
}

export const CLIENTS: ClientConfig[] = [
  {
    client: "typhoon-coffee",
    epicId: "pr-rick-7r1",
    hostMatch: ["typhoon\\.coffee$", "^localhost", "^127\\.0\\.0\\.1"],
    injector: {
      contentKey: "typhoon-contact-form-2026-05-11",
      formTitle: "Get a Free Consultation",
      // Hide typhoon native popup overlay + embedded CF7 forms when flag=rickform.
      // - #recall_popup_overlay — their dark backdrop
      // - .recall-popup / .recall-popup-overlay — Anna popup body
      // - form.wpcf7-form / form#subscribe_form — embedded CF7 fallback
      hideSelector:
        "#recall_popup_overlay, .recall-popup-overlay, .recall-popup, form.wpcf7-form, form#subscribe_form",
      // Real typhoon CTA selectors (verified via DOM inspection 2026-05-14):
      // - .js-recall-popup-call — both "Get a free consultation" buttons
      // - .button--primary / .button--lite — hero + nav CTAs
      // - a[href*="/contacts/"] — header/footer "Contacts" link
      triggerSelector:
        ".js-recall-popup-call, .button--primary, .button--lite, a[href*='/contacts/'], a[href*='#wpcf7'], .wpcf7-submit, input[type='submit'], button[type='submit']",
    },
  },
  // TEMPLATE for future clients — copy this block, fill in selectors, register content plugin.
  // {
  //   client: "{client-domain}",
  //   epicId: "pr-rick-XXX",
  //   hostMatch: ["{client-domain}\\.{tld}$"],
  //   injector: {
  //     contentKey: "{client-domain}-contact-form-YYYY-MM-DD",
  //     formTitle: "...",
  //     hideSelector: "...",
  //     triggerSelector: "...",
  //   },
  // },
]

export function resolveClientConfig(
  doc: Document = typeof document !== "undefined" ? document : ({} as Document),
  loc: Location | undefined = typeof window !== "undefined" ? window.location : undefined,
): ClientConfig {
  // 1. explicit data-rick-client override on mount point
  const overlay = doc.getElementById?.("rick-form-overlay")
  const explicit = overlay?.getAttribute("data-rick-client")
  if (explicit) {
    const match = CLIENTS.find((c) => c.client === explicit)
    if (match) return match
  }

  // 2. URL ?rickClient= override (qa/preview)
  const params = new URLSearchParams(loc?.search ?? "")
  const queryOverride = params.get("rickClient")
  if (queryOverride) {
    const match = CLIENTS.find((c) => c.client === queryOverride)
    if (match) return match
  }

  // 3. hostname pattern match
  const host = loc?.hostname ?? ""
  for (const c of CLIENTS) {
    if (c.hostMatch.some((re) => new RegExp(re, "i").test(host))) return c
  }

  // 4. fallback to first
  return CLIENTS[0]
}
