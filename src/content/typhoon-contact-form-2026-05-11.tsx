// Content plugin: minimalist typhoon-coffee /contacts/ form (wpcf7-f171).
// Owner directives 2026-05-14:
//   1. Phone field — single input with + prefix, country auto-detect in label header
//   2. Submit button — typhoon primary blue (#0100D8), not black
//   3. WhatsApp link at bottom — short CTA + icon, links to typhoon real WA number
//   4. Tooltips on kg chips (already wired)
//   5. All spacings on 3px micro-modular grid
//   6. Chip spacing tight enough for 2-per-row layout
//
// 3 form fields + WA fallback:
//   1. Phone (auto-detect country code → flag/dial/iso/e164)
//   2. ChipSelector — "How did you hear about us?" (status)
//   3. ChipSelector — "How much coffee do you plan to roast per week?"
//   4. Footer: "Have a question? Ask on WhatsApp →" link (sales fallback)
//
// Wire contract:
//   - bridge POST to flow.rick.ai/webhook/snippetFormHook (DocumentInjector)
//   - form_name: "typhoon-contact-form-2026-05-11" (unchanged)
//   - phone normalized as e164 + iso + dial (CRM gets all 4)
import { useState, type FormEvent } from "react"
import { ChipSelector, type ChipOption } from "../components/chip-selector"
import { PhoneAutoCountry, type PhoneStatus } from "../components/phone-auto-country"
import { RickFormRegistry, type RickFormContentProps } from "../registry"
import styles from "./typhoon-contact-form-2026-05-11.module.scss"

const STATUS_OPTIONS: ChipOption[] = [
  { value: "Launching a roasting business (startup)", label: "Launching a roastery (startup)" },
  { value: "I want to start roasting in my coffee shop", label: "Start roasting in my coffee shop" },
  { value: "Upgrading an existing roastery", label: "Upgrading an existing roastery" },
  { value: "Roasting for myself / as a hobby", label: "Roasting as a hobby" },
  { value: "Other", label: "Other" },
]

const KG_OPTIONS: ChipOption[] = [
  { value: "<5 kg/week", label: "<5 kg/week", tooltip: "Typhoon 2.5 PRO · ~€19 500 · 1 kg/batch" },
  { value: "5-20 kg/week", label: "5-20 kg/week", tooltip: "Typhoon 5 PRO · ~€26 900 · 5 kg/batch" },
  { value: "20-50 kg/week", label: "20-50 kg/week", tooltip: "Typhoon 10 PRO · ~€37 500 · 10 kg/batch" },
  { value: "50-150 kg/week", label: "50-150 kg/week", tooltip: "Typhoon 20 electro · ~€48 000 · 20 kg/batch" },
  { value: "150+ kg/week", label: "150+ kg/week", tooltip: "Typhoon 30 electro · ~€68 000 · 30 kg/batch" },
  { value: "Not sure yet", label: "Not sure yet", tooltip: "We'll suggest the right size on the call" },
]

// Real typhoon WhatsApp link (discovered via DOM probe 2026-05-14):
// https://wa.me/420774501511?text=Hi! I have a question about Typhoon roasters...
// +420 = Czech Republic (Typhoon HQ). Truncate pre-baked text for cleaner UX.
const TYPHOON_WA_URL = "https://wa.me/420774501511?text=" +
  encodeURIComponent("Hi! I have a question about Typhoon roasters. Can you help?")

export function TyphoonContactForm({ onSubmit }: RickFormContentProps) {
  const [phone, setPhone] = useState("")
  const [phoneStatus, setPhoneStatus] = useState<PhoneStatus | null>(null)
  const [e164, setE164] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [kgPerWeek, setKgPerWeek] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const digitsOnly = phone.replace(/\D/g, "")
    // Per owner directive: never block on country/format — only on too-short (<6 digits).
    if (digitsOnly.length < 6) {
      setError("Need at least 6 digits — we'll call you back")
      return
    }
    if (!status) {
      setError("Pick your current situation")
      return
    }
    if (!kgPerWeek) {
      setError("Pick your weekly volume")
      return
    }
    setError(null)
    onSubmit({
      "your-phone-visual": phone,
      "your-phone-e164": e164,
      "your-phone-country": phoneStatus?.iso ?? "",
      "your-phone-country-name": phoneStatus?.name ?? "",
      "your-phone-status-kind": phoneStatus?.kind ?? "",
      "current-status": status ?? "",
      "kg-per-week": kgPerWeek ?? "",
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <PhoneAutoCountry
        label="Phone number"
        name="your-phone-visual"
        value={phone}
        onChange={({ value, status: s, e164: next }) => {
          setPhone(value)
          setPhoneStatus(s)
          setE164(next)
        }}
        placeholder="+1 (212) 555-1234"
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
        hint="1 kg ≈ 100 cups • 5 kg/wk small cafe • 20-50 busy cafe • 150+ established roastery"
        options={KG_OPTIONS}
        value={kgPerWeek}
        onChange={setKgPerWeek}
        name="kg-per-week"
      />
      {error ? <p className={styles.error}>{error}</p> : null}
      <button type="submit" className={styles.submit}>
        Get a Free Consultation
      </button>
      <a
        href={TYPHOON_WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.waLink}
      >
        <svg className={styles.waIcon} viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.886 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.464 3.488"
          />
        </svg>
        <span>Have a question? Ask on WhatsApp →</span>
      </a>
    </form>
  )
}

RickFormRegistry.register("typhoon-contact-form-2026-05-11", TyphoonContactForm)
