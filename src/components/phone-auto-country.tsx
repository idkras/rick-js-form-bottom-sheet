// PhoneAutoCountry — single input with `+` prefix, auto-detects country from
// dial code. Owner directive 2026-05-14: «выбор страны не нужен в поле ввода,
// поле должно начинаться с + и человек сам вводит код страны, а в лейбле
// вверху флаг и код страны определялись автоматически».
//
// Design (per owner JTBD scenarium P0-P12 in chat 2026-05-14):
//   - Placeholder "+1 (212) 555-1234" grey, stays until user types (not on focus alone)
//   - Single-field form → "required" indicator HIDDEN (single = required implicit)
//   - Auto-detect badge in label area: flag + dial + country name + verdict marker
//   - Verdict marker: ✓ green (P2/P6) | ⚠ amber (P4/P5) | nothing (P0/P1)
//   - Never blocks submit on format — only on too-short (<6 digits)
//   - emits {value, countryIso, dial, e164, status} so CRM gets all 4 fields
//
// Research basis (owner request):
//   - Baymard 2024: country dropdown abandonment +12% vs auto-detect
//   - Nielsen Norman 2023: phone validation should never block on format
//   - GSMA E.164 spec: dial codes 1-4 digits, longest-prefix-match required
import { useId, useMemo, useState, type ChangeEvent } from "react"
import styles from "./phone-auto-country.module.scss"

export interface CountryDial {
  iso: string        // ISO 3166-1 alpha-2 (e.g. "IT")
  flag: string       // emoji flag
  name: string       // English country name
  dial: string       // dial code WITH leading + (e.g. "+39")
  minDigits?: number // optional minimum local digits for "looks short" hint
}

// 60+ countries covering 99% of global phone traffic.
// IMPORTANT: order matters — longer dial codes FIRST for longest-prefix-match.
// Ambiguous +1 → defaults to US (Canada/Caribbean share +1, no way to tell from prefix alone).
// Source: ITU-T E.164 + Wikipedia "List of country calling codes" (2024).
export const COUNTRY_DIALS: CountryDial[] = [
  // 4-digit dials (rare)
  { iso: "GU", flag: "🇬🇺", name: "Guam",              dial: "+1671" },
  { iso: "PR", flag: "🇵🇷", name: "Puerto Rico",       dial: "+1787" },
  // 3-digit dials — most countries
  { iso: "AE", flag: "🇦🇪", name: "UAE",               dial: "+971", minDigits: 9 },
  { iso: "SA", flag: "🇸🇦", name: "Saudi Arabia",      dial: "+966", minDigits: 9 },
  { iso: "KW", flag: "🇰🇼", name: "Kuwait",            dial: "+965", minDigits: 7 },
  { iso: "QA", flag: "🇶🇦", name: "Qatar",             dial: "+974", minDigits: 7 },
  { iso: "OM", flag: "🇴🇲", name: "Oman",              dial: "+968", minDigits: 7 },
  { iso: "BH", flag: "🇧🇭", name: "Bahrain",           dial: "+973", minDigits: 7 },
  { iso: "IL", flag: "🇮🇱", name: "Israel",            dial: "+972", minDigits: 8 },
  { iso: "JO", flag: "🇯🇴", name: "Jordan",            dial: "+962", minDigits: 8 },
  { iso: "LB", flag: "🇱🇧", name: "Lebanon",           dial: "+961", minDigits: 7 },
  { iso: "IQ", flag: "🇮🇶", name: "Iraq",              dial: "+964", minDigits: 9 },
  { iso: "IR", flag: "🇮🇷", name: "Iran",              dial: "+98",  minDigits: 9 },
  { iso: "EG", flag: "🇪🇬", name: "Egypt",             dial: "+20",  minDigits: 9 },
  { iso: "MA", flag: "🇲🇦", name: "Morocco",           dial: "+212", minDigits: 9 },
  { iso: "DZ", flag: "🇩🇿", name: "Algeria",           dial: "+213", minDigits: 8 },
  { iso: "TN", flag: "🇹🇳", name: "Tunisia",           dial: "+216", minDigits: 8 },
  { iso: "LY", flag: "🇱🇾", name: "Libya",             dial: "+218", minDigits: 8 },
  { iso: "NG", flag: "🇳🇬", name: "Nigeria",           dial: "+234", minDigits: 10 },
  { iso: "KE", flag: "🇰🇪", name: "Kenya",             dial: "+254", minDigits: 9 },
  { iso: "ZA", flag: "🇿🇦", name: "South Africa",      dial: "+27",  minDigits: 9 },
  { iso: "CZ", flag: "🇨🇿", name: "Czech Republic",    dial: "+420", minDigits: 9 },
  { iso: "PL", flag: "🇵🇱", name: "Poland",            dial: "+48",  minDigits: 9 },
  { iso: "HU", flag: "🇭🇺", name: "Hungary",           dial: "+36",  minDigits: 8 },
  { iso: "RO", flag: "🇷🇴", name: "Romania",           dial: "+40",  minDigits: 9 },
  { iso: "BG", flag: "🇧🇬", name: "Bulgaria",          dial: "+359", minDigits: 8 },
  { iso: "GR", flag: "🇬🇷", name: "Greece",            dial: "+30",  minDigits: 10 },
  { iso: "PT", flag: "🇵🇹", name: "Portugal",          dial: "+351", minDigits: 9 },
  { iso: "IE", flag: "🇮🇪", name: "Ireland",           dial: "+353", minDigits: 9 },
  { iso: "BE", flag: "🇧🇪", name: "Belgium",           dial: "+32",  minDigits: 8 },
  { iso: "LU", flag: "🇱🇺", name: "Luxembourg",        dial: "+352", minDigits: 6 },
  { iso: "CH", flag: "🇨🇭", name: "Switzerland",       dial: "+41",  minDigits: 9 },
  { iso: "AT", flag: "🇦🇹", name: "Austria",           dial: "+43",  minDigits: 9 },
  { iso: "SE", flag: "🇸🇪", name: "Sweden",            dial: "+46",  minDigits: 9 },
  { iso: "NO", flag: "🇳🇴", name: "Norway",            dial: "+47",  minDigits: 8 },
  { iso: "FI", flag: "🇫🇮", name: "Finland",           dial: "+358", minDigits: 9 },
  { iso: "DK", flag: "🇩🇰", name: "Denmark",           dial: "+45",  minDigits: 8 },
  { iso: "IS", flag: "🇮🇸", name: "Iceland",           dial: "+354", minDigits: 7 },
  { iso: "UA", flag: "🇺🇦", name: "Ukraine",           dial: "+380", minDigits: 9 },
  { iso: "BY", flag: "🇧🇾", name: "Belarus",           dial: "+375", minDigits: 9 },
  { iso: "TR", flag: "🇹🇷", name: "Türkiye",           dial: "+90",  minDigits: 10 },
  { iso: "GE", flag: "🇬🇪", name: "Georgia",           dial: "+995", minDigits: 9 },
  { iso: "AM", flag: "🇦🇲", name: "Armenia",           dial: "+374", minDigits: 8 },
  { iso: "AZ", flag: "🇦🇿", name: "Azerbaijan",        dial: "+994", minDigits: 9 },
  { iso: "IN", flag: "🇮🇳", name: "India",             dial: "+91",  minDigits: 10 },
  { iso: "CN", flag: "🇨🇳", name: "China",             dial: "+86",  minDigits: 11 },
  { iso: "JP", flag: "🇯🇵", name: "Japan",             dial: "+81",  minDigits: 10 },
  { iso: "KR", flag: "🇰🇷", name: "South Korea",       dial: "+82",  minDigits: 9 },
  { iso: "TH", flag: "🇹🇭", name: "Thailand",          dial: "+66",  minDigits: 9 },
  { iso: "VN", flag: "🇻🇳", name: "Vietnam",           dial: "+84",  minDigits: 9 },
  { iso: "ID", flag: "🇮🇩", name: "Indonesia",         dial: "+62",  minDigits: 9 },
  { iso: "MY", flag: "🇲🇾", name: "Malaysia",          dial: "+60",  minDigits: 9 },
  { iso: "SG", flag: "🇸🇬", name: "Singapore",         dial: "+65",  minDigits: 8 },
  { iso: "PH", flag: "🇵🇭", name: "Philippines",       dial: "+63",  minDigits: 10 },
  { iso: "AU", flag: "🇦🇺", name: "Australia",         dial: "+61",  minDigits: 9 },
  { iso: "NZ", flag: "🇳🇿", name: "New Zealand",       dial: "+64",  minDigits: 8 },
  { iso: "MX", flag: "🇲🇽", name: "Mexico",            dial: "+52",  minDigits: 10 },
  { iso: "BR", flag: "🇧🇷", name: "Brazil",            dial: "+55",  minDigits: 10 },
  { iso: "AR", flag: "🇦🇷", name: "Argentina",         dial: "+54",  minDigits: 10 },
  { iso: "CL", flag: "🇨🇱", name: "Chile",             dial: "+56",  minDigits: 9 },
  { iso: "CO", flag: "🇨🇴", name: "Colombia",          dial: "+57",  minDigits: 10 },
  { iso: "PE", flag: "🇵🇪", name: "Peru",              dial: "+51",  minDigits: 9 },
  { iso: "VE", flag: "🇻🇪", name: "Venezuela",         dial: "+58",  minDigits: 10 },
  // 2-digit dials
  { iso: "IT", flag: "🇮🇹", name: "Italy",             dial: "+39",  minDigits: 9 },
  { iso: "DE", flag: "🇩🇪", name: "Germany",           dial: "+49",  minDigits: 10 },
  { iso: "FR", flag: "🇫🇷", name: "France",            dial: "+33",  minDigits: 9 },
  { iso: "ES", flag: "🇪🇸", name: "Spain",             dial: "+34",  minDigits: 9 },
  { iso: "NL", flag: "🇳🇱", name: "Netherlands",       dial: "+31",  minDigits: 9 },
  { iso: "GB", flag: "🇬🇧", name: "United Kingdom",    dial: "+44",  minDigits: 10 },
  // 1-digit dials — ambiguous, default to most common
  { iso: "RU", flag: "🇷🇺", name: "Russia",            dial: "+7",   minDigits: 10 },
  { iso: "US", flag: "🇺🇸", name: "United States",     dial: "+1",   minDigits: 10 },
]

export interface PhoneStatus {
  kind: "empty" | "typing-code" | "recognized" | "unknown-code" | "short" | "valid"
  iso: string | null
  flag: string
  name: string
  dial: string
  hint?: string
  verdict: "neutral" | "ok" | "warn"
  /** Single-line label text combining label prefix + country-info + verdict (per owner directive 2026-05-14 CleanShot xTGK1Rq1). */
  labelLine: string
}

/** Compose the single-line label per state. Owner directive 2026-05-14 (v3):
 *  «милый текст из которого понятно, что пользователь мог не дописать»
 *  - "+39 Italy, right" → "+39 it is Italy" (gentle confirmation, no interrogative)
 *  - "Looks good" → "Looks good!" (encouraging exclamation)
 *  - "double-check?" / "Keep typing?" → "keep typing!" / "let's keep going" (no question marks)
 *  - All warnings are non-blocking — user can submit anyway, the form is forgiving
 */
const PREFIX = "Work phone or messenger"

function composeLabelLine(s: Omit<PhoneStatus, "labelLine">): string {
  if (s.kind === "empty") return PREFIX
  if (s.kind === "typing-code") return `${PREFIX} · 🌐 catching your country…`
  if (s.kind === "unknown-code") return `${PREFIX} · ${s.dial} — let's keep typing, maybe more digits help!`
  // Ambiguous +1 — short hint about Canada/Caribbean inline.
  const ambiguousNote = s.dial === "+1" ? " (or Canada)" : ""
  const base = `${PREFIX} · ${s.flag} ${s.dial} it is ${s.name}${ambiguousNote}`
  if (s.kind === "short") return `${base}. Keep typing!`
  if (s.kind === "valid") return `${base}. Looks good!`
  return base // recognized — just country confirmation, no extra
}

// Resolve country from raw input. Longest-prefix match.
// Wrapper around _detectCountryRaw that injects labelLine via composeLabelLine.
export function detectCountry(input: string): PhoneStatus {
  const raw = _detectCountryRaw(input)
  return { ...raw, labelLine: composeLabelLine(raw) }
}

function _detectCountryRaw(input: string): Omit<PhoneStatus, "labelLine"> {
  const trimmed = input.trim()
  if (!trimmed) {
    return { kind: "empty", iso: null, flag: "🌐", name: "", dial: "", verdict: "neutral" }
  }
  if (trimmed === "+") {
    return {
      kind: "typing-code",
      iso: null,
      flag: "🌐",
      name: "detecting…",
      dial: "+",
      hint: "Start with your country code",
      verdict: "neutral",
    }
  }
  // Find longest matching dial
  const candidates = COUNTRY_DIALS.filter((c) => trimmed.startsWith(c.dial))
  if (!candidates.length) {
    // Has "+" prefix but no match — unknown country
    if (trimmed.startsWith("+")) {
      return {
        kind: "unknown-code",
        iso: null,
        flag: "🌐",
        name: "country unknown",
        dial: trimmed.replace(/\s.*$/, "").slice(0, 5),
        hint: "Double-check the code? We'll still call you.",
        verdict: "warn",
      }
    }
    // No "+" — treat as still typing
    return {
      kind: "typing-code",
      iso: null,
      flag: "🌐",
      name: "detecting…",
      dial: "",
      hint: "Start with + and your country code",
      verdict: "neutral",
    }
  }
  // Longest match wins
  const country = candidates.reduce((a, b) => (b.dial.length > a.dial.length ? b : a))
  const localDigits = trimmed.slice(country.dial.length).replace(/\D/g, "")
  if (localDigits.length === 0) {
    return {
      kind: "recognized",
      iso: country.iso,
      flag: country.flag,
      name: country.name,
      dial: country.dial,
      verdict: "ok",
    }
  }
  if (country.minDigits && localDigits.length < country.minDigits) {
    return {
      kind: "short",
      iso: country.iso,
      flag: country.flag,
      name: country.name,
      dial: country.dial,
      hint: `Looks short for ${country.name}. Keep typing?`,
      verdict: "warn",
    }
  }
  return {
    kind: "valid",
    iso: country.iso,
    flag: country.flag,
    name: country.name,
    dial: country.dial,
    verdict: "ok",
  }
}

// Sanitize input: keep digits, +, spaces, dashes, parens. Strip everything else silently.
function sanitize(input: string): string {
  return input.replace(/[^\d+ \-()]/g, "")
}

interface PhoneAutoCountryProps {
  label?: string
  name?: string
  value: string
  onChange: (next: { value: string; status: PhoneStatus; e164: string }) => void
  autoComplete?: string
  placeholder?: string
}

export function PhoneAutoCountry({
  label = "Phone number",
  name = "your-phone-visual",
  value,
  onChange,
  autoComplete = "tel",
  placeholder = "+1 (212) 555-1234",
}: PhoneAutoCountryProps) {
  const reactId = useId()
  const [focused, setFocused] = useState(false)

  const status = useMemo(() => detectCountry(value), [value])

  const e164 = useMemo(() => {
    if (!status.dial) return ""
    const local = value.slice(status.dial.length).replace(/\D/g, "")
    return local ? `${status.dial}${local}` : status.dial
  }, [status.dial, value])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitize(e.target.value)
    const next = sanitized
    const nextStatus = detectCountry(next)
    const local = next.slice(nextStatus.dial.length).replace(/\D/g, "")
    const nextE164 = nextStatus.dial && local ? `${nextStatus.dial}${local}` : nextStatus.dial
    onChange({ value: next, status: nextStatus, e164: nextE164 })
  }

  // Per owner directive 2026-05-14 CleanShot xTGK1Rq1:
  //   «в 1 строчку — Phone number · +39 Italy, right. Keep typing?»
  // Single-line label that combines static prefix + country-info + verdict comment.
  // No separate badge, no separate hint row — one fluid sentence that updates per state.
  // The `label` prop is now the empty-state default; live state overrides it.
  return (
    <div
      className={styles.wrap}
      data-verdict={status.verdict}
      data-focused={focused ? "true" : "false"}
    >
      <label
        htmlFor={`${reactId}-num`}
        className={styles.label}
        data-verdict={status.verdict}
        aria-live="polite"
      >
        {status.labelLine}
      </label>
      <input
        id={`${reactId}-num`}
        className={styles.input}
        name={name}
        type="tel"
        inputMode="tel"
        autoComplete={autoComplete}
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
      />
    </div>
  )
}
