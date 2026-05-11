import { useId, type InputHTMLAttributes } from "react"
import styles from "./text-field.module.scss"

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function TextField({ label, id, ...rest }: TextFieldProps) {
  const reactId = useId()
  const inputId = id ?? reactId
  return (
    <div className={styles.field}>
      {label ? (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      ) : null}
      <input id={inputId} className={styles.input} {...rest} />
    </div>
  )
}

export function TextArea({
  label,
  id,
  ...rest
}: { label?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const reactId = useId()
  const inputId = id ?? reactId
  return (
    <div className={styles.field}>
      {label ? (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      ) : null}
      <textarea id={inputId} className={styles.textarea} rows={3} {...rest} />
    </div>
  )
}
