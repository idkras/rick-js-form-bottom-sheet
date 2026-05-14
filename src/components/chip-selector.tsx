// ChipSelector — pill-style single-select.
// Visual reference: owner screenshot 2026-05-11 (replaces wpcf7 radio buttons).
// Behaviour mimics shadcn/ui ToggleGroup type="single" with custom check-icon styling.
//
// Pattern (per shadcn): unstyled Radix toggle primitives + Tailwind classes.
// In this scaffold we ship vanilla CSS modules to keep build deps minimal —
// migrate to @radix-ui/react-toggle-group later if cross-component a11y matters.
import { useId } from "react"
import { CheckIcon } from "../icons/check"
import styles from "./chip-selector.module.scss"

export interface ChipOption {
  value: string
  label: string
  tooltip?: string  // optional pricing/copy hint shown on hover (typhoon offers)
}

interface ChipSelectorProps {
  title: string
  hint?: string
  options: ChipOption[]
  value: string | null
  onChange: (value: string) => void
  name?: string
}

export function ChipSelector({
  title,
  hint,
  options,
  value,
  onChange,
  name,
}: ChipSelectorProps) {
  const groupId = useId()
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 id={`${groupId}-title`} className={styles.title}>
          {title}
        </h3>
        {hint ? <p className={styles.hint}>{hint}</p> : null}
      </div>
      <div
        role="radiogroup"
        aria-labelledby={`${groupId}-title`}
        className={styles.chipRow}
      >
        {options.map((opt) => {
          const selected = value === opt.value
          return (
            <button
              type="button"
              key={opt.value}
              role="radio"
              aria-checked={selected}
              data-state={selected ? "on" : "off"}
              data-name={name}
              className={selected ? styles.chipSelected : styles.chip}
              onClick={() => onChange(opt.value)}
              title={opt.tooltip}
            >
              {selected ? <CheckIcon className={styles.checkIcon} /> : null}
              <span className={styles.chipLabel}>{opt.label}</span>
              {opt.tooltip ? <span className={styles.chipTooltip}>{opt.tooltip}</span> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
