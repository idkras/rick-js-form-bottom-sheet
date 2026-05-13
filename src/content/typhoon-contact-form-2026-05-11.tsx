// Content plugin: 1:1 baseline copy of typhoon.coffee /contacts/ form (wpcf7-f171).
// Captured 2026-05-11. See landing-capture-2026-05-11/.
//
// Design canon (skill 4-form-via-bottom-sheet):
// - Floating labels inside fields (tbank.ru/cards/debit-cards/ pattern)
// - No "*" — grey-italic word "required" inside label, tight 5px gap
// - Field order: phone → email → name (lowest friction first)
// - <select name="current-status"> → ChipSelector
// - Details label = call-to-action
// - Submit routes through callbacks.onSubmit → Rick.js bridge → flow.rick.ai/webhook/snippetFormHook
//
// Typhoon-specific (per owner directive 2026-05-12):
// - Added kg-per-week question (typhoon roaster line: 2.5/5/10/20/30 kg per batch)
//   with examples mapping kg → cups/week → roastery scale.
// - All wpcf7 input names preserved 1:1 so n8n bridge schema doesn't break.
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

// Typhoon roaster line maps directly to weekly volume buckets.
// Source: [rick.ai]/clients/all-clients/typhoon-coffee/knowledge-base/
//   sales-scripts-positioning-audit-2026-02-25/raw/.../offers-prices.tsv
// Approx cups/kg = 100 (1 espresso ~10g, 1 v60 ~15g — рознично-усреднённо).
const KG_OPTIONS: ChipOption[] = [
  { value: "<5 kg/week", label: "<5 kg/week" },
  { value: "5-20 kg/week", label: "5-20 kg/week" },
  { value: "20-50 kg/week", label: "20-50 kg/week" },
  { value: "50-150 kg/week", label: "50-150 kg/week" },
  { value: "150+ kg/week", label: "150+ kg/week" },
  { value: "Not sure yet", label: "Not sure yet" },
]

export function TyphoonContactForm({ onSubmit }: RickFormContentProps) {
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [kgPerWeek, setKgPerWeek] = useState<string | null>(null)
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
      "kg-per-week": kgPerWeek ?? "",
      "details": details,
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
        hint="Pick what best matches your situation"
        options={STATUS_OPTIONS}
        value={status}
        onChange={setStatus}
        name="current-status"
      />
      <ChipSelector
        title="How much coffee do you plan to roast per week?"
        hint="Roughly: 1 kg ≈ 100 cups • 5 kg/week — small specialty cafe • 20-50 kg/week — busy cafe or small wholesaler • 150+ kg/week — established roastery"
        options={KG_OPTIONS}
        value={kgPerWeek}
        onChange={setKgPerWeek}
        name="kg-per-week"
      />
      <TextArea
        label="What should we know before the call? (current setup, location, timing)"
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
