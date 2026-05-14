// Content plugin: minimalist typhoon-coffee /contacts/ form (wpcf7-f171).
// Owner directive 2026-05-14: «убрать имя и почту, оставить только поле с
// телефоном и кодом страны и 2мя вопросами квиза».
//
// 3 fields total — friction-minimized for cold-traffic CTA:
//   1. Phone number + country code (e164 normalized server-side)
//   2. ChipSelector — "How did you hear about us?" (status / startup / coffee shop / hobby)
//   3. ChipSelector — "How much coffee do you plan to roast per week?" (typhoon roaster line)
//
// Removed fields (vs prior 2026-05-11 variant):
//   - your-email (cold traffic doesn't want to give email yet)
//   - your-name (we collect on the follow-up call)
//   - details textarea (replaced by structured chip answers)
//
// Wire contract:
//   - bridge POST to flow.rick.ai/webhook/snippetFormHook (DocumentInjector)
//   - form_name: "typhoon-contact-form-2026-05-11" (unchanged so analytics persist)
//   - phone normalized as e164 (`+39612345678`) — replaces wpcf7 `your-phone-visual`
//   - 2 chip answers preserved at original wpcf7 names (`current-status`, `kg-per-week`)
//
// Design canon (skill 4-form-via-bottom-sheet):
//   - Floating-label canon (tbank.ru pattern), grey-italic "required", 5px gap
//   - No "*" markers
//   - Single CTA button "Get a Free Consultation"
import { useState, type FormEvent } from "react"
import { ChipSelector, type ChipOption } from "../components/chip-selector"
import { PhoneWithCountry } from "../components/phone-with-country"
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
// Tooltips pull pricing from offers-prices.tsv (typhoon-roasters-sales-sheet-2026-02-25):
//   Typhoon 2.5 PRO €19 500 · 5 PRO €26 900 · 10 PRO €37 500 · 20 electro €48 000 · 30 electro €68 000.
// Approx cups/kg = 100 (1 espresso ~10g, 1 v60 ~15g — рознично-усреднённо).
const KG_OPTIONS: ChipOption[] = [
  { value: "<5 kg/week", label: "<5 kg/week", tooltip: "Typhoon 2.5 PRO · ~€19 500 · 1 kg/batch" },
  { value: "5-20 kg/week", label: "5-20 kg/week", tooltip: "Typhoon 5 PRO · ~€26 900 · 5 kg/batch" },
  { value: "20-50 kg/week", label: "20-50 kg/week", tooltip: "Typhoon 10 PRO · ~€37 500 · 10 kg/batch" },
  { value: "50-150 kg/week", label: "50-150 kg/week", tooltip: "Typhoon 20 electro · ~€48 000 · 20 kg/batch" },
  { value: "150+ kg/week", label: "150+ kg/week", tooltip: "Typhoon 30 electro · ~€68 000 · 30 kg/batch" },
  { value: "Not sure yet", label: "Not sure yet", tooltip: "We'll suggest the right size on the call" },
]

export function TyphoonContactForm({ onSubmit }: RickFormContentProps) {
  const [phone, setPhone] = useState("")
  const [countryIso, setCountryIso] = useState("IT")
  const [dial, setDial] = useState("+39")
  const [e164, setE164] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [kgPerWeek, setKgPerWeek] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const digitsOnly = phone.replace(/\D/g, "")
    if (digitsOnly.length < 6) {
      setError("Please enter a valid phone number")
      return
    }
    if (!status) {
      setError("Please pick your current situation")
      return
    }
    if (!kgPerWeek) {
      setError("Please pick your weekly volume")
      return
    }
    setError(null)
    onSubmit({
      "your-phone-visual": phone,                  // human-formatted for analytics
      "your-phone-e164": e164,                     // dial-prefixed normalized for CRM
      "your-phone-country": countryIso,            // ISO alpha-2 for routing
      "current-status": status ?? "",
      "kg-per-week": kgPerWeek ?? "",
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <PhoneWithCountry
        label="Phone number"
        requiredText="required"
        name="your-phone-visual"
        value={phone}
        countryIso={countryIso}
        onChange={({ value, countryIso: nextIso, dial: nextDial, e164: nextE164 }) => {
          setPhone(value)
          setCountryIso(nextIso)
          setDial(nextDial)
          setE164(nextE164)
        }}
        required
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
      {error ? <p className={styles.error}>{error}</p> : null}
      <button type="submit" className={styles.submit}>
        Get a Free Consultation
      </button>
      <p className={styles.privacyNote}>
        We'll call you on {dial} — no email, no spam. One call, plain talk.
      </p>
    </form>
  )
}

RickFormRegistry.register("typhoon-contact-form-2026-05-11", TyphoonContactForm)
