// Detect 4 quick clicks anywhere within `windowMs` to reveal the flag panel.
// Listens on parent document AND any same-origin iframe contentDocument
// (clicks inside iframe do NOT bubble to parent — must attach handler to
// each frame separately).
import { useEffect } from "react"

export function useQuadClick(
  onActivate: () => void,
  windowMs = 1500,
  iframeRef?: React.RefObject<HTMLIFrameElement | null>,
): void {
  useEffect(() => {
    let timestamps: number[] = []

    const handler = (e: Event) => {
      const target = e.target as HTMLElement | null
      if (target?.closest?.("[data-no-quad]")) return

      const now = Date.now()
      timestamps = timestamps.filter((t) => now - t < windowMs)
      timestamps.push(now)
      if (timestamps.length >= 4) {
        timestamps = []
        onActivate()
      }
    }

    document.addEventListener("click", handler, true)

    // Iframe: clicks don't bubble cross-frame, attach to its contentDocument
    let iframeDoc: Document | null = null
    let iframeLoadHandler: (() => void) | null = null

    const attachIframe = () => {
      const frame = iframeRef?.current
      if (!frame) return
      try {
        iframeDoc = frame.contentDocument
        if (iframeDoc) {
          iframeDoc.addEventListener("click", handler, true)
        }
      } catch {
        // cross-origin — silent fail, parent listener still works for our overlay
      }
    }

    if (iframeRef?.current) {
      // Wait for iframe to be ready (contentDocument exists after load)
      if (iframeRef.current.contentDocument?.readyState === "complete") {
        attachIframe()
      } else {
        iframeLoadHandler = attachIframe
        iframeRef.current.addEventListener("load", iframeLoadHandler)
      }
    }

    return () => {
      document.removeEventListener("click", handler, true)
      if (iframeDoc) {
        try { iframeDoc.removeEventListener("click", handler, true) } catch {}
      }
      if (iframeRef?.current && iframeLoadHandler) {
        iframeRef.current.removeEventListener("load", iframeLoadHandler)
      }
    }
  }, [onActivate, windowMs, iframeRef])
}
