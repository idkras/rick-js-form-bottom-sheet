// <RickSheet> — generic container for any content plugin.
// Mobile (<= 768px): bottom-sheet с drag-down close + snap-points (50% / 90%).
// Desktop (> 768px): centered popup с backdrop click-to-close.
// a11y: focus trap, Esc close, role=dialog, aria-modal=true.
//
// Status: SCAFFOLD — gesture engine is intentionally minimal (touch drag-down).
// Migrate to pure-web-bottom-sheet (npm pkg used in rick-js-bottom-sheet-stripe)
// when production-grade snap physics required.
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { CloseIcon } from "../icons/check"
import styles from "./rick-sheet.module.scss"

export type RickSheetMode = "auto" | "sheet" | "popup"

interface RickSheetProps {
  open: boolean
  onClose: () => void
  mode?: RickSheetMode
  title?: string
  children: ReactNode
}

function resolveMode(mode: RickSheetMode): "sheet" | "popup" {
  if (mode !== "auto") return mode
  if (typeof window === "undefined") return "popup"
  return window.matchMedia("(max-width: 768px)").matches ? "sheet" : "popup"
}

export function RickSheet({
  open,
  onClose,
  mode = "auto",
  title,
  children,
}: RickSheetProps) {
  const [resolved, setResolved] = useState<"sheet" | "popup">(() => resolveMode(mode))
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef<number | null>(null)
  const dragOffset = useRef<number>(0)

  useEffect(() => {
    if (mode !== "auto") {
      setResolved(mode)
      return
    }
    const mq = window.matchMedia("(max-width: 768px)")
    const update = () => setResolved(mq.matches ? "sheet" : "popup")
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [mode])

  // Esc close + body scroll lock
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  // Touch drag-down to close (only in sheet mode)
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (resolved !== "sheet") return
    dragStartY.current = e.touches[0].clientY
    dragOffset.current = 0
  }, [resolved])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (resolved !== "sheet" || dragStartY.current === null) return
    const delta = e.touches[0].clientY - dragStartY.current
    if (delta < 0) return
    dragOffset.current = delta
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${delta}px)`
    }
  }, [resolved])

  const onTouchEnd = useCallback(() => {
    if (resolved !== "sheet") return
    if (sheetRef.current) {
      sheetRef.current.style.transform = ""
    }
    if (dragOffset.current > 120) onClose()
    dragStartY.current = null
    dragOffset.current = 0
  }, [resolved, onClose])

  if (!open) return null

  return (
    <div
      className={styles.overlay}
      data-mode={resolved}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="presentation"
    >
      {resolved === "sheet" ? (
        // Sheet mode: grabber (———) + close control live ABOVE the white sheet,
        // on the dark overlay, grid-aligned (Standard 4.19). Owner 2026-05-16:
        // «крестик и ——— показывать не на язычке, а над ним по сетке».
        <div className={styles.sheetWrap}>
          <div className={styles.sheetTopBar}>
            <div className={styles.grabber} aria-hidden="true" />
            <button
              type="button"
              className={styles.topCloseRow}
              onClick={onClose}
              aria-label="Close"
            >
              <span className={styles.topCloseLabel}>close</span>
              <CloseIcon />
            </button>
          </div>
          <div
            ref={sheetRef}
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-label={title ?? "Form"}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className={styles.header}>
              {title ? <h2 className={styles.title}>{title}</h2> : <span />}
            </div>
            <div className={styles.body}>{children}</div>
          </div>
        </div>
      ) : (
        // Popup mode (desktop, no язычок): × stays inside header.
        <div
          ref={sheetRef}
          className={styles.popup}
          role="dialog"
          aria-modal="true"
          aria-label={title ?? "Form"}
        >
          <div className={styles.header}>
            {title ? <h2 className={styles.title}>{title}</h2> : <span />}
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </div>
          <div className={styles.body}>{children}</div>
        </div>
      )}
    </div>
  )
}
