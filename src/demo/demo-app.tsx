import { useState } from "react"
import { RickForm } from "../rick-form"
import "../content/typhoon-contact-form-2026-05-11"
import styles from "./demo-app.module.scss"

const CONTENT_KEYS = ["typhoon-contact-form-2026-05-11"]

export function DemoApp() {
  const [mode, setMode] = useState<"auto" | "sheet" | "popup">("auto")
  const [contentKey, setContentKey] = useState<string>(CONTENT_KEYS[0])
  const [lastSubmit, setLastSubmit] = useState<Record<string, unknown> | null>(null)

  const handleOpen = () => {
    RickForm.open({
      contentKey,
      title: "Get a Free Consultation",
      mode,
      callbacks: {
        onSubmit: (values) => {
          setLastSubmit(values)
          // In production this is replaced by Rick.js bridge POST to
          // flow.rick.ai/webhook/snippetFormHook with rick_* attribution fields.
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

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <h1>RickForm · demo configurator</h1>
        <p>Vite dev server. Mobile = bottom-sheet, desktop = popup. Auto switch by media query.</p>
      </header>
      <section className={styles.controls}>
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
      </section>
      {lastSubmit ? (
        <section className={styles.result}>
          <h2>Last submit payload</h2>
          <pre>{JSON.stringify(lastSubmit, null, 2)}</pre>
        </section>
      ) : null}
    </div>
  )
}
