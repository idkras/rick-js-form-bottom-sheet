// OverlayApp — production-shape root WITHOUT iframe.
// The typhoon.coffee page IS document.body (proxied by vite middleware).
// We mount FeatureFlagPanel as overlay + IframeInjector becomes
// DocumentInjector targeting `document` directly (no contentDocument hop).
import { useCallback, useEffect, useState } from "react"
import { Agentation } from "agentation"
import { RickForm } from "./rick-form"
import "./content/typhoon-contact-form-2026-05-11"
import { FeatureFlagPanel } from "./feature-flag/feature-flag-panel"
import { useQuadClick } from "./feature-flag/use-quad-click"
import { DocumentInjector, type InjectorConfig } from "./feature-flag/document-injector"

const CLIENT_CONFIG = {
  client: "typhoon-coffee",
  epicId: "pr-rick-7r1",
  injector: {
    contentKey: "typhoon-contact-form-2026-05-11",
    formTitle: "Get a Free Consultation",
    // Hide typhoon native popup overlay + its inline forms when flag=rickform.
    // Discovered via DOM inspection 2026-05-14:
    //   - #recall_popup_overlay is the dark backdrop their JS toggles
    //   - .recall-popup-overlay is the popup body (Anna + "24 hours" message)
    //   - form.wpcf7-form / form#subscribe_form — embedded CF7 forms on /contacts/
    hideSelector:
      "#recall_popup_overlay, .recall-popup-overlay, .recall-popup, form.wpcf7-form, form#subscribe_form",
    // Real typhoon CTA selectors (discovered via DOM inspection 2026-05-14):
    //   - .js-recall-popup-call — both "Get a free consultation" buttons
    //   - .button--primary text-match — "I'm ready to discuss the details" hero CTA
    //   - a[href*="/contacts/"] — header/footer "Contacts" nav link
    //   - .wpcf7-submit — direct CF7 submit fallback
    triggerSelector:
      ".js-recall-popup-call, .button--primary, .button--lite, a[href*='/contacts/'], a[href*='#wpcf7'], .wpcf7-submit, input[type='submit'], button[type='submit']",
  } satisfies InjectorConfig,
}

export function OverlayApp() {
  const [panelVisible, setPanelVisible] = useState(false)
  const [flagState, setFlagState] = useState<"native" | "rickform">("native")
  const [injector] = useState(() => new DocumentInjector(document, RickForm))

  useQuadClick(useCallback(() => setPanelVisible((v) => !v), []))

  useEffect(() => {
    if (flagState === "rickform") injector.enable(CLIENT_CONFIG.injector)
    else injector.disable()
  }, [flagState, injector])

  const handleToggle = useCallback(() => {
    setFlagState((c) => (c === "native" ? "rickform" : "native"))
  }, [])

  return (
    <>
      <FeatureFlagPanel
        visible={panelVisible}
        flagState={flagState}
        onToggle={handleToggle}
        onClose={() => setPanelVisible(false)}
        client={CLIENT_CONFIG.client}
        epicId={CLIENT_CONFIG.epicId}
      />
      {/* Agentation toolbar shown together with our feature-flag pill (per owner directive 2026-05-13: «показывать так же после 4х кликов под нашей формой с фича-флагом») */}
      {panelVisible ? <Agentation /> : null}
    </>
  )
}
