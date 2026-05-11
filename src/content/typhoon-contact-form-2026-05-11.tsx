// Content plugin: 1:1 baseline copy of typhoon.coffee /contacts/ form (wpcf7-f171).
// Captured 2026-05-11 — see [rick.ai]/clients/all-clients/typhoon-coffee/projects/pr-rick-7r1/landing-capture-2026-05-11/.
//
// CHANGES vs original:
// - <select name="current-status"> → <ChipSelector> (per owner screenshot 2026-05-11,
//   shadcn ToggleGroup style — pill chips with check icon for selected).
// - Submit goes through callbacks.onSubmit (Rick.js bridge → flow.rick.ai/webhook/snippetFormHook)
//   instead of wpcf7 AJAX endpoint.
//
// All other fields, copy, validation, CTA — identical to baseline.
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
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [details, setDetails] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name || !email || !phone) {
      setError("Please fill in name, email and phone")
      return
    }
    setError(null)
    onSubmit({
      "your-name": name,
      "your-email": email,
      "your-phone-visual": phone,
      "current-status": status ?? "",
      details,
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <TextField
        label="Your name *"
        name="your-name"
        type="text"
        required
        placeholder="Your name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="name"
      />
      <TextField
        label="Email *"
        name="your-email"
        type="email"
        required
        placeholder="Email *"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />
      <TextField
        label="Phone number *"
        name="your-phone-visual"
        type="tel"
        required
        placeholder="Phone number *"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        autoComplete="tel"
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
        label="Details"
        name="details"
        placeholder="Let us know any details or features you're looking for"
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

// Register on module load so any `import "./content/typhoon-contact-form-2026-05-11"`
// (e.g. from standalone.tsx) wires the plugin into the registry.
RickFormRegistry.register("typhoon-contact-form-2026-05-11", TyphoonContactForm)
