// Production-shape demo: client site iframe at full viewport + invisible 4-click
// activation for owner feature-flag panel. NO dev configurator. NO black panel.
//
// User flow:
// 1. Page loads → iframe shows typhoon.coffee /contacts/ at 100vw/100vh
// 2. 4 quick clicks anywhere → FeatureFlagPanel slides in bottom-right
// 3. Toggle "Use RickForm" → CSS injected into iframe hides native form,
//    CTAs hijacked to open <RickSheet>
// 4. Feedback in panel → .md download → drop into client KB folder
//
// In production via add_code rule the same DOM manipulation runs from inside
// the client page (same origin). Iframe here is the local dev approximation.

import { useCallback, useRef, useState, useEffect } from "react"
import { RickForm } from "./rick-form"
import "./content/typhoon-contact-form-2026-05-11"
import { FeatureFlagPanel } from "./feature-flag/feature-flag-panel"
import { useQuadClick } from "./feature-flag/use-quad-click"
import { IframeInjector, type InjectorConfig } from "./feature-flag/iframe-injector"
import styles from "./app.module.scss"

// Per-client config — in production this comes from AppCraft add_code rule.
const CLIENT_CONFIG = {
  client: "typhoon-coffee",
  epicId: "pr-rick-7r1",
  iframeSrc: "/typhoon/contacts/",  // Vite proxy → https://typhoon.coffee/contacts/ (live, navigation works, same-origin)
  injector: {
    contentKey: "typhoon-contact-form-2026-05-11",
    formTitle: "Get a Free Consultation",
    hideSelector: "form.wpcf7-form, form#subscribe_form",
    triggerSelector: "input[type='submit'], button[type='submit'], a.cta-button, a[href*='#wpcf7']",
  } satisfies InjectorConfig,
}

export function App() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const injectorRef = useRef<IframeInjector | null>(null)
  const [panelVisible, setPanelVisible] = useState(false)
  const [flagState, setFlagState] = useState<"native" | "rickform">("native")

  useQuadClick(useCallback(() => setPanelVisible((v) => !v), []), 1500, iframeRef)

  // Wait for iframe to load, then attach injector
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const onLoad = () => {
      injectorRef.current = new IframeInjector(iframe, RickForm)
      // If flag was already on (e.g. after refresh + persisted state) re-apply
      if (flagState === "rickform") {
        injectorRef.current.enable(CLIENT_CONFIG.injector)
      }
    }
    iframe.addEventListener("load", onLoad)
    return () => iframe.removeEventListener("load", onLoad)
    // intentionally NOT depending on flagState — handled in toggle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleToggle = useCallback(() => {
    setFlagState((current) => {
      const next = current === "native" ? "rickform" : "native"
      const inj = injectorRef.current
      if (inj) {
        if (next === "rickform") inj.enable(CLIENT_CONFIG.injector)
        else inj.disable()
      }
      return next
    })
  }, [])

  const handleClose = useCallback(() => setPanelVisible(false), [])

  return (
    <div className={styles.root}>
      <iframe
        ref={iframeRef}
        src={CLIENT_CONFIG.iframeSrc}
        title="Client site"
        className={styles.siteFrame}
      />

      {/* Tiny hint at top-left: shown only when panel hidden, fades after 6s */}
      <FirstLoadHint visible={!panelVisible} />

      <FeatureFlagPanel
        visible={panelVisible}
        flagState={flagState}
        onToggle={handleToggle}
        onClose={handleClose}
        client={CLIENT_CONFIG.client}
        epicId={CLIENT_CONFIG.epicId}
      />
    </div>
  )
}

function FirstLoadHint({ visible }: { visible: boolean }) {
  const [shown, setShown] = useState(true)
  useEffect(() => {
    const id = window.setTimeout(() => setShown(false), 6000)
    return () => window.clearTimeout(id)
  }, [])
  if (!visible || !shown) return null
  return (
    <div className={styles.hint} data-no-quad>
      4 quick clicks anywhere → feature flag panel
    </div>
  )
}
