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
  const [gridOpen, setGridOpen] = useState(false)
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

      {/* Grid overlay pill — per Standard 4.19 Micromodular Typography Grid */}
      <div className={styles.pill} data-grid-pill>
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
        <span className={styles.label} title="Show 12px micromodular grid overlay (Standard 4.19)">
          Grid {gridShow ? "вкл" : "выкл"}
        </span>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => setGridOpen((v) => !v)}
          aria-label={gridOpen ? "Close grid settings" : "Open grid settings"}
          aria-expanded={gridOpen}
          disabled={!gridShow}
          style={!gridShow ? { opacity: 0.4 } : undefined}
        >
          {gridOpen ? "−" : "⚙"}
        </button>
      </div>

      {gridOpen && gridShow ? (
        <div className={styles.feedbackPopover}>
          <label className={styles.gridRow}>
            <span className={styles.gridRowLabel}>Size</span>
            <input
              type="number"
              min={4}
              max={48}
              step={2}
              value={gridSize}
              onChange={(e) => onGridSizeChange(Number(e.target.value))}
              className={styles.gridNumberInput}
            />
            <span className={styles.gridUnit}>px</span>
          </label>
          <label className={styles.gridRow}>
            <span className={styles.gridRowLabel}>Color</span>
            <input
              type="color"
              value={gridColor}
              onChange={(e) => onGridColorChange(e.target.value)}
              className={styles.gridColorInput}
            />
            <input
              type="text"
              value={gridColor}
              onChange={(e) => onGridColorChange(e.target.value)}
              pattern="^#[0-9A-Fa-f]{6}$"
              className={styles.gridHexInput}
            />
          </label>
          <label className={styles.gridRow}>
            <span className={styles.gridRowLabel}>Opacity</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={gridOpacity}
              onChange={(e) => onGridOpacityChange(Number(e.target.value))}
              className={styles.gridSlider}
            />
            <span className={styles.gridUnit}>{gridOpacity}%</span>
          </label>
        </div>
      ) : null}

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
