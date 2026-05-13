// Floating-label text input/textarea. Label sits inside the field, floats up
// on focus or when value is non-empty. Required marker = grey-italic word
// ("обязательный" / "required"), not "*".
//
// Pattern: tbank.ru/cards/debit-cards/ — see project pr-rick-7r1.
import {
  useId,
  useState,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react"
import styles from "./text-field.module.scss"

interface FloatingFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "placeholder"> {
  label: string
  requiredText?: string | null  // grey-italic hint when required; null disables
}

export function TextField({
  label,
  requiredText = "обязательный",
  required,
  id,
  value,
  defaultValue,
  onFocus,
  onBlur,
  ...rest
}: FloatingFieldProps) {
  const reactId = useId()
  const inputId = id ?? reactId
  const [focused, setFocused] = useState(false)
  const hasValue = Boolean(
    (value ?? defaultValue ?? "").toString().length > 0,
  )
  const lifted = focused || hasValue

  return (
    <div
      className={styles.field}
      data-state={lifted ? "lifted" : "rest"}
      data-focused={focused ? "true" : "false"}
    >
      <input
        id={inputId}
        className={styles.input}
        value={value}
        defaultValue={defaultValue}
        required={required}
        onFocus={(e) => {
          setFocused(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          onBlur?.(e)
        }}
        {...rest}
      />
      <label htmlFor={inputId} className={styles.label}>
        <span className={styles.labelText}>{label}</span>
        {required && requiredText ? (
          <span className={styles.requiredHint}>{requiredText}</span>
        ) : null}
      </label>
    </div>
  )
}

interface FloatingTextAreaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "placeholder"> {
  label: string
  requiredText?: string | null
}

export function TextArea({
  label,
  requiredText = null,
  required,
  id,
  value,
  defaultValue,
  onFocus,
  onBlur,
  ...rest
}: FloatingTextAreaProps) {
  const reactId = useId()
  const inputId = id ?? reactId
  const [focused, setFocused] = useState(false)
  const hasValue = Boolean(
    (value ?? defaultValue ?? "").toString().length > 0,
  )
  const lifted = focused || hasValue

  return (
    <div
      className={styles.field}
      data-state={lifted ? "lifted" : "rest"}
      data-focused={focused ? "true" : "false"}
    >
      <textarea
        id={inputId}
        className={styles.textarea}
        rows={3}
        value={value}
        defaultValue={defaultValue}
        required={required}
        onFocus={(e) => {
          setFocused(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          onBlur?.(e)
        }}
        {...rest}
      />
      <label htmlFor={inputId} className={styles.labelTextarea}>
        <span className={styles.labelText}>{label}</span>
        {required && requiredText ? (
          <span className={styles.requiredHint}>{requiredText}</span>
        ) : null}
      </label>
    </div>
  )
}
