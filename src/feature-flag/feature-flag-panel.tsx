// Small floating panel that appears after 4 quick clicks anywhere on the page.
// Lets owner toggle "Use RickForm" feature flag and leave design feedback that
// downloads as .md ready to drop into client KB.
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
}

export function FeatureFlagPanel({
  visible,
  flagState,
  onToggle,
  onClose,
  client,
  epicId,
}: FeatureFlagPanelProps) {
  const [comment, setComment] = useState("")
  const [entries, setEntries] = useState<FeedbackEntry[]>(() => loadFeedback())
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (visible && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [visible])

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
    const updated = appendFeedback(entry)
    setEntries(updated)
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
    <div data-no-quad className={styles.panel} role="dialog" aria-label="Feature flags and feedback">
      <header className={styles.header}>
        <span className={styles.title}>Feature flags · {client}</span>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>

      <section className={styles.section}>
        <label className={styles.toggleRow}>
          <span className={styles.toggleLabel}>
            Use RickForm
            <span className={styles.toggleHint}>
              {flagState === "rickform"
                ? "✓ native form hidden, our bottom-sheet active"
                : "off — client sees their own form"}
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={flagState === "rickform"}
            data-state={flagState}
            className={styles.switch}
            onClick={onToggle}
          >
            <span className={styles.knob} />
          </button>
        </label>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Design feedback</h3>
        <textarea
          ref={textareaRef}
          className={styles.feedbackInput}
          placeholder="What to fix? Where? How? (e.g. 'chip Other на mobile прижат к краю — gap 12px')"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />
        <div className={styles.feedbackRow}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={handleSaveFeedback}
            disabled={!comment.trim()}
          >
            Save entry
          </button>
          <span className={styles.entriesCount}>
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </span>
        </div>
        {entries.length > 0 ? (
          <div className={styles.feedbackActions}>
            <button type="button" className={styles.linkBtn} onClick={handleDownload}>
              Download .md
            </button>
            <button type="button" className={styles.linkBtnDanger} onClick={handleClear}>
              Clear all
            </button>
          </div>
        ) : null}
      </section>

      <footer className={styles.footer}>
        <p className={styles.footerText}>
          Сохранить .md в:
          <br />
          <code className={styles.codePath}>
            [rick.ai]/clients/all-clients/{client}/projects/{epicId}/design-feedback/{new Date().toISOString().slice(0, 10)}.md
          </code>
        </p>
      </footer>
    </div>
  )
}
