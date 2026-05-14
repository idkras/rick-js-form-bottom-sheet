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
    hideSelector: "form.wpcf7-form, form#subscribe_form",
    triggerSelector:
      "input[type='submit'], button[type='submit'], .wpcf7-submit, a[href*='#wpcf7'], a[href*='/contacts'], .button[href*='consultation']",
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
