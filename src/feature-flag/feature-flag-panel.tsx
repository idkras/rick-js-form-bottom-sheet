// Unified vertical stack panel: all feature flags in ONE black pill, right-side.
// Per owner directive 2026-05-15:
//   - 1 black pill справа со всеми feature flags
//   - switchers + labels left-aligned (выключка слева)
//   - settings reveal on label HOVER (не клик на ⚙)
//   - agentation pill separate, LEFT of feature flag panel
import { useEffect, useRef, useState } from "react"
import {
  appendFeedback,
  clearFeedback,
  downloadMarkdown,
  exportAsMarkdown,
  loadFeedback,
  type FeedbackEntry,
} from "./feedback-store"
import styles from "./feature-flag-panel.module.scss"

interface FeatureFlagPanelProps {
  visible: boolean
  flagState: "native" | "rickform"
  onToggle: () => void
  onClose: () => void
  client: string
  epicId: string
  // Micromodule grid overlay (per Standard 4.19)
  gridShow: boolean
  gridSize: number
  gridColor: string
  gridOpacity: number
  onGridToggle: () => void
  onGridSizeChange: (size: number) => void
  onGridColorChange: (color: string) => void
  onGridOpacityChange: (opacity: number) => void
}

export function FeatureFlagPanel({
  visible,
  flagState,
  onToggle,
  onClose,
  client,
  epicId,
  gridShow,
  gridSize,
  gridColor,
  gridOpacity,
  onGridToggle,
  onGridSizeChange,
  onGridColorChange,
  onGridOpacityChange,
}: FeatureFlagPanelProps) {
  const [comment, setComment] = useState("")
  const [entries, setEntries] = useState<FeedbackEntry[]>(() => loadFeedback())
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (feedbackOpen && textareaRef.current) textareaRef.current.focus()
  }, [feedbackOpen])

  // Figma-style opacity hotkey (owner 2026-05-16): grid ON → digit keys set
  // opacity. Single `0` = 100% (Figma convention), `5` = 50%, `1` = 10%,
  // two digits within 500ms = exact (`2`+`5` → 25%). Ignored while typing
  // in an input/textarea/select so it never hijacks normal field editing.
  useEffect(() => {
    if (!gridShow) return
    let buf = ""
    let timer: ReturnType<typeof setTimeout> | undefined

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const tag = t?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t?.isContentEditable) return
      if (!/^[0-9]$/.test(e.key)) return
      e.preventDefault()
      buf += e.key
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        // Figma convention: single non-zero digit d → d*10 (5→50, 1→10, 9→90);
        // single 0 → 100; two digits → exact (2,5 → 25). Clamp 0..100.
        let next: number
        if (buf === "0") next = 100
        else if (buf.length === 1) next = parseInt(buf, 10) * 10
        else next = Math.max(0, Math.min(100, parseInt(buf, 10)))
        onGridOpacityChange(next)
        buf = ""
      }, 450)
    }

    document.addEventListener("keydown", onKey, true)
    return () => {
      document.removeEventListener("keydown", onKey, true)
      if (timer) clearTimeout(timer)
    }
  }, [gridShow, onGridOpacityChange])

  if (!visible) return null

  const handleSaveFeedback = () => {
    if (!comment.trim()) return
    const entry: FeedbackEntry = {
      ts: new Date().toISOString(),
      flagState,
      url: window.location.href,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      comment: comment.trim(),
    }
    setEntries(appendFeedback(entry))
    setComment("")
  }

  const handleDownload = () => {
    const md = exportAsMarkdown(entries, { client, epicId })
    const today = new Date().toISOString().slice(0, 10)
    downloadMarkdown(md, `${today}-design-feedback-${client}-${epicId}.md`)
  }

  const handleClear = () => {
    if (!window.confirm(`Clear ${entries.length} feedback entries?`)) return
    clearFeedback()
    setEntries([])
  }

  return (
    <div data-no-quad className={styles.panelWrap} role="dialog" aria-label="Feature flags">
      <div className={styles.panel}>
        {/* Header — close X aligned right */}
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>Feature flags</span>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close panel">×</button>
        </div>

        {/* Row 1 — RickForm toggle */}
        <div className={styles.flagRow}>
          <button
            type="button"
            role="switch"
            aria-checked={flagState === "rickform"}
            aria-label="Use RickForm"
            data-state={flagState}
            className={styles.switch}
            onClick={onToggle}
          >
            <span className={styles.knob} />
          </button>
          <span className={styles.flagLabel}>RickForm</span>
          <button
            type="button"
            className={styles.inlineActionBtn}
            onClick={() => setFeedbackOpen((v) => !v)}
            aria-label={feedbackOpen ? "Close feedback" : "Open feedback"}
            aria-expanded={feedbackOpen}
            title="Feedback"
          >
            {feedbackOpen ? "−" : "✎"}
            {entries.length > 0 ? <span className={styles.dot}>{entries.length}</span> : null}
          </button>
        </div>

        {/* Row 2 — Micromodule grid toggle + hover-reveal settings */}
        <div className={`${styles.flagRow} ${styles.flagRowWithHover}`} data-grid-pill>
          <button
            type="button"
            role="switch"
            aria-checked={gridShow}
            aria-label="Show micromodule grid overlay"
            data-state={gridShow ? "on" : "off"}
            className={styles.switch}
            onClick={onGridToggle}
          >
            <span className={styles.knob} />
          </button>
          <span className={styles.flagLabel} title="Micromodular 12px grid overlay per Standard 4.19 — settings appear when ON">
            Grid {gridShow ? "вкл" : "выкл"}
          </span>

          {/* Inline settings — sticky visible whenever grid is ON (no hover gating, RCA 2026-05-16) */}
          {gridShow && (
            <div className={styles.inlineSettings}>
              <label className={styles.settingsCell}>
                <span className={styles.settingsLabel}>px</span>
                <input
                  type="number"
                  min={4}
                  max={48}
                  step={2}
                  value={gridSize}
                  onChange={(e) => onGridSizeChange(Number(e.target.value))}
                  className={styles.numberInput}
                />
              </label>
              <label className={styles.settingsCell}>
                <input
                  type="color"
                  value={gridColor}
                  onChange={(e) => onGridColorChange(e.target.value)}
                  className={styles.colorInput}
                  aria-label="Grid color"
                />
              </label>
              <label
                className={styles.settingsCell}
                title="Opacity %. Hotkey (Figma-style): point at page, press digits — 5=50%, 0=100%, 2 then 5=25%"
              >
                <span className={styles.settingsLabel}>α</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={5}
                  value={gridOpacity}
                  onChange={(e) =>
                    onGridOpacityChange(Math.max(0, Math.min(100, Number(e.target.value))))
                  }
                  className={styles.numberInput}
                  aria-label="Grid opacity percent"
                />
                <span className={styles.settingsUnit}>%</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {feedbackOpen ? (
        <div className={styles.feedbackPopover}>
          <textarea
            ref={textareaRef}
            className={styles.feedbackInput}
            placeholder="What to fix? Where? How?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
          />
          <div className={styles.feedbackRow}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={handleSaveFeedback}
              disabled={!comment.trim()}
            >
              Save
            </button>
            {entries.length > 0 ? (
              <>
                <button type="button" className={styles.linkBtn} onClick={handleDownload}>
                  Download .md
                </button>
                <button type="button" className={styles.linkBtnDanger} onClick={handleClear}>
                  Clear
                </button>
              </>
            ) : null}
          </div>
          <p className={styles.pathHint} title="Save downloaded .md to this canonical path">
            → <code>{`projects/${epicId}/design-feedback/${new Date().toISOString().slice(0, 10)}.md`}</code>
          </p>
        </div>
      ) : null}
    </div>
  )
}
