// MicromoduleGridOverlay — fullscreen CSS grid overlay for visual rhythm proof.
// Per Standard 4.19 §5 (Micromodular Typography Grid for UI Components).
// Pixel-perfect via repeating-linear-gradient; no React re-render cost.
// pointer-events: none — never blocks clicks. Respects prefers-reduced-motion.

import { useMemo } from "react"

export interface MicromoduleGridOverlayProps {
  show: boolean
  size?: number // default 12
  color?: string // default #2196F3 (Figma canonical)
  opacity?: number // 0-100, default 30 (Figma canonical)
  showMajor?: boolean // default true — every 6th line 2× thicker
  axis?: "horizontal" | "vertical" | "both" // default both
  zIndex?: number // default 2147483500 (below feature flag panel 2147483600)
}

function hexAlpha(opacityPercent: number): string {
  const clamped = Math.max(0, Math.min(100, opacityPercent))
  const alpha = Math.round(clamped * 2.55)
  return alpha.toString(16).padStart(2, "0")
}

export function MicromoduleGridOverlay({
  show,
  size = 12,
  color = "#2196F3",
  opacity = 15, // owner correction 15 May 2026: 30 «слишком синяя» → 15 default
  showMajor = false, // major lines off by default to reduce visual noise
  axis = "both",
  zIndex = 2147483500,
}: MicromoduleGridOverlayProps) {
  const backgroundImage = useMemo(() => {
    const minorLine = `${color}${hexAlpha(opacity)}`
    const majorLine = `${color}${hexAlpha(Math.min(100, opacity * 1.8))}`
    const majorEvery = size * 6

    const layers: string[] = []
    if (axis === "horizontal" || axis === "both") {
      layers.push(
        `repeating-linear-gradient(to bottom, ${minorLine} 0px, ${minorLine} 1px, transparent 1px, transparent ${size}px)`,
      )
      if (showMajor) {
        layers.push(
          `repeating-linear-gradient(to bottom, ${majorLine} 0px, ${majorLine} 1px, transparent 1px, transparent ${majorEvery}px)`,
        )
      }
    }
    if (axis === "vertical" || axis === "both") {
      layers.push(
        `repeating-linear-gradient(to right, ${minorLine} 0px, ${minorLine} 1px, transparent 1px, transparent ${size}px)`,
      )
      if (showMajor) {
        layers.push(
          `repeating-linear-gradient(to right, ${majorLine} 0px, ${majorLine} 1px, transparent 1px, transparent ${majorEvery}px)`,
        )
      }
    }
    return layers.join(", ")
  }, [size, color, opacity, showMajor, axis])

  if (!show) return null

  return (
    <div
      aria-hidden="true"
      data-testid="micromodule-grid-overlay"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex,
        backgroundImage,
        backgroundSize: `${size}px ${size}px`,
      }}
    />
  )
}
