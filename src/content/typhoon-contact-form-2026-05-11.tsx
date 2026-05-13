// Content plugin: 1:1 baseline copy of typhoon.coffee /contacts/ form (wpcf7-f171).
// Captured 2026-05-11. See landing-capture-2026-05-11/.
//
// Design canon applied (per owner directive 2026-05-12, see skill
// 4-form-bottom-sheet-via-yazychek):
// - Floating labels inside the field (tbank.ru/cards/debit-cards/ pattern)
// - No "*" for required — grey-italic word "обязательный"/"required" inside label
// - Field order: phone → email → name (lowest friction first)
// - <select name="current-status"> → ChipSelector (shadcn ToggleGroup style)
// - Details label = call-to-action ("Что важно учесть...") instead of bland "Details"
// - Submit routes through callbacks.onSubmit → Rick.js bridge → flow.rick.ai/webhook/snippetFormHook
//
// All wpcf7 input names preserved 1:1 so the n8n bridge payload schema doesn't break.
import { useState, type FormEvent } from "react"
import { ChipSelector, type ChipOption } from "../components/chip-selector"
import { TextField, TextArea } from "../components/text-field"
import { RickFormRegistry, type RickFormContentProps } from "../registry"
import styles from "./typhoon-contact-form-2026-05-11.module.scss"

const STATUS_OPTIONS: ChipOption[] = [
  { value: "Launching a roasting business (startup)", label: "Launching a roastery (startup)" },
  { value: "I want to start roasting in my coffee shop", label: "Start roasting in my coffee shop" },
  { value: "Upgrading an existing roastery", label: "Upgrading an existing roastery" },
  { value: "Roasting for myself / as a hobby", label: "Roasting as a hobby" },
  { value: "Other", label: "Other" },
]

export function TyphoonContactForm({ onSubmit }: RickFormContentProps) {
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [details, setDetails] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!phone || !email || !name) {
      setError("Please fill phone, email and name")
      return
    }
    setError(null)
    onSubmit({
      "your-phone-visual": phone,
      "your-email": email,
      "your-name": name,
      "current-status": status ?? "",
      details,
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <TextField
        label="Phone number"
        requiredText="required"
        name="your-phone-visual"
        type="tel"
        required
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        autoComplete="tel"
      />
      <TextField
        label="Email"
        requiredText="required"
        name="your-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />
      <TextField
        label="Your name"
        requiredText="required"
        name="your-name"
        type="text"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="name"
      />
      <ChipSelector
        title="How did you hear about us?"
        hint="Select the option that best describes how you found us"
        options={STATUS_OPTIONS}
        value={status}
        onChange={setStatus}
        name="current-status"
      />
      <TextArea
        label="What should we know before the call? (roaster size, location, timing)"
        name="details"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
      />
      {error ? <p className={styles.error}>{error}</p> : null}
      <button type="submit" className={styles.submit}>
        Get a Free Consultation
      </button>
    </form>
  )
}

RickFormRegistry.register("typhoon-contact-form-2026-05-11", TyphoonContactForm)
