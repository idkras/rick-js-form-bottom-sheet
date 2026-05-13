// Tiny pill that appears after 4 quick clicks. Switcher LEFT.
// Collapsed: ~280×44px. Click 'feedback' link → expands inline textarea.
// Per owner directive 2026-05-13: «форма с фича флагом должна быть меньше
// в 10 раз и свитчер должен быть слева».
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
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (feedbackOpen && textareaRef.current) textareaRef.current.focus()
  }, [feedbackOpen])

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
    <div data-no-quad className={styles.pillWrap} role="dialog" aria-label="Feature flag">
      <div className={styles.pill}>
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
        <span className={styles.label} title={flagState === "rickform" ? "Native form hidden, RickForm active" : "Client sees their own form"}>
          RickForm
        </span>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => setFeedbackOpen((v) => !v)}
          aria-label={feedbackOpen ? "Close feedback" : "Open feedback"}
          aria-expanded={feedbackOpen}
        >
          {feedbackOpen ? "−" : "✎"}
          {entries.length > 0 ? <span className={styles.dot}>{entries.length}</span> : null}
        </button>
        <button type="button" className={styles.iconBtn} onClick={onClose} aria-label="Close panel">
          ×
        </button>
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
