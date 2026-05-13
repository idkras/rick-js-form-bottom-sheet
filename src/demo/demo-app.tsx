// Demo configurator with REAL typhoon.coffee site as backdrop iframe.
// Per owner directive 2026-05-12: "на фоне должен быть 1-в-1 дизайн сайта
// и лендинга взятый с прода".
//
// Mirror source: public/typhoon-mirror/index.html — copy of /contacts/ page
// captured 2026-05-11 (skill 4-rick-js-snippet-tag-create-and-validate).
// External assets (CSS / images / fonts) load from typhoon.coffee CDN — same as live.
import { useState } from "react"
import { RickForm } from "../rick-form"
import "../content/typhoon-contact-form-2026-05-11"
import styles from "./demo-app.module.scss"

const CONTENT_KEYS = ["typhoon-contact-form-2026-05-11"]
const CLIENT_MIRRORS: Record<string, string> = {
  "typhoon-contact-form-2026-05-11": "/typhoon-mirror/index.html",
}

export function DemoApp() {
  const [mode, setMode] = useState<"auto" | "sheet" | "popup">("auto")
  const [contentKey, setContentKey] = useState<string>(CONTENT_KEYS[0])
  const [lastSubmit, setLastSubmit] = useState<Record<string, unknown> | null>(null)
  const [showControls, setShowControls] = useState(true)

  const handleOpen = () => {
    RickForm.open({
      contentKey,
      title: "Get a Free Consultation",
      mode,
      callbacks: {
        onSubmit: (values) => {
          setLastSubmit(values)
          // eslint-disable-next-line no-console
          console.log("[RickForm demo] submit:", values)
        },
        onClose: () => {
          // eslint-disable-next-line no-console
          console.log("[RickForm demo] close")
        },
      },
    })
  }

  const mirrorSrc = CLIENT_MIRRORS[contentKey]

  return (
    <div className={styles.shell}>
      {mirrorSrc ? (
        <iframe
          src={mirrorSrc}
          title="Client site backdrop"
          className={styles.backdrop}
        />
      ) : null}

      <div className={styles.controlsToggle}>
        <button
          type="button"
          onClick={() => setShowControls((v) => !v)}
          className={styles.toggleBtn}
        >
          {showControls ? "Hide controls" : "Show controls"}
        </button>
      </div>

      {showControls ? (
        <div className={styles.controls}>
          <header className={styles.controlsHeader}>
            <h1>RickForm · demo</h1>
            <p>Backdrop = 1:1 production site of selected client. Mobile = bottom-sheet, desktop = popup.</p>
          </header>
          <label className={styles.field}>
            <span>Content key</span>
            <select value={contentKey} onChange={(e) => setContentKey(e.target.value)}>
              {CONTENT_KEYS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Mode</span>
            <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
              <option value="auto">auto</option>
              <option value="sheet">sheet (mobile)</option>
              <option value="popup">popup (desktop)</option>
            </select>
          </label>
          <button type="button" className={styles.openBtn} onClick={handleOpen}>
            Open form
          </button>
          {lastSubmit ? (
            <div className={styles.result}>
              <h2>Last submit payload</h2>
              <pre>{JSON.stringify(lastSubmit, null, 2)}</pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
