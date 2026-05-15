// OverlayApp — production-shape root WITHOUT iframe.
// The client page IS document.body (proxied by vite middleware OR mounted by
// production add_code rule). We mount FeatureFlagPanel as overlay + DocumentInjector
// targeting `document` directly (no contentDocument hop).
//
// Universal multi-client: client is resolved at runtime via resolveClientConfig()
// from src/client-config.ts. Adding a new client = entry in CLIENTS array + content
// plugin in src/content/. No edits to this file required.
import { useCallback, useEffect, useMemo, useState } from "react"
import { Agentation } from "agentation"
import { RickForm } from "./rick-form"
// Side-effect imports: every content plugin self-registers via RickFormRegistry.register
// on module evaluation. Tree-shaker keeps these because of side effects.
import "./content/typhoon-contact-form-2026-05-11"
import { FeatureFlagPanel } from "./feature-flag/feature-flag-panel"
import { useQuadClick } from "./feature-flag/use-quad-click"
import { DocumentInjector } from "./feature-flag/document-injector"
import { resolveClientConfig } from "./client-config"
import { MicromoduleGridOverlay } from "./components/MicromoduleGridOverlay"

export function OverlayApp() {
  // Resolve client once on mount — hostname / data-rick-client / ?rickClient= override.
  const clientConfig = useMemo(() => resolveClientConfig(document, window.location), [])

  const [panelVisible, setPanelVisible] = useState(false)
  const [flagState, setFlagState] = useState<"native" | "rickform">("native")
  const [injector] = useState(() => new DocumentInjector(document, RickForm))

  // Micromodule grid overlay state — per Standard 4.19 §5.1
  // Owner correction 15 May 2026: opacity 30 «слишком синяя» → default 15
  const [gridShow, setGridShow] = useState(false)
  const [gridSize, setGridSize] = useState(12)
  const [gridColor, setGridColor] = useState("#2196F3")
  const [gridOpacity, setGridOpacity] = useState(15)

  useQuadClick(useCallback(() => setPanelVisible((v) => !v), []))

  useEffect(() => {
    if (flagState === "rickform") injector.enable(clientConfig.injector)
    else injector.disable()
  }, [flagState, injector, clientConfig])

  const handleToggle = useCallback(() => {
    setFlagState((c) => (c === "native" ? "rickform" : "native"))
  }, [])

  return (
    <>
      <MicromoduleGridOverlay
        show={gridShow}
        size={gridSize}
        color={gridColor}
        opacity={gridOpacity}
      />
      <FeatureFlagPanel
        visible={panelVisible}
        flagState={flagState}
        onToggle={handleToggle}
        onClose={() => setPanelVisible(false)}
        client={clientConfig.client}
        epicId={clientConfig.epicId}
        gridShow={gridShow}
        gridSize={gridSize}
        gridColor={gridColor}
        gridOpacity={gridOpacity}
        onGridToggle={() => setGridShow((v) => !v)}
        onGridSizeChange={setGridSize}
        onGridColorChange={setGridColor}
        onGridOpacityChange={setGridOpacity}
      />
      {/* Agentation toolbar shown together with our feature-flag pill (per owner directive 2026-05-13: «показывать так же после 4х кликов под нашей формой с фича-флагом»). Positioned LEFT of RickForm pill via .agentation-toolbar CSS in feature-flag-panel.module.scss */}
      {panelVisible ? <Agentation /> : null}
    </>
  )
}
