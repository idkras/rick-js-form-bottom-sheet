// PhoneWithCountry — phone input prefixed by an ISO country-dial-code select.
// Top-12 markets curated from typhoon.coffee orders 2025-2026 (per data-analyst
// rough estimate, refine when client provides real order distribution):
//   EU: Italy, Germany, France, Spain, Netherlands, UK
//   GCC: UAE, Saudi Arabia
//   Americas: USA, Canada, Brazil, Mexico
// "Other" picks +XXX free-text override.
//
// Design canon (skill 4-form-via-bottom-sheet):
//   - Code select left, phone input right, single visual rounded field
//   - Floating label "Phone number" stays above
//   - "required" grey-italic hint at 5px tight gap
//   - On focus: ring expands, no jumpy layout
import { useId, useMemo, useState, type ChangeEvent } from "react"
import styles from "./phone-with-country.module.scss"

export interface CountryDial {
  iso: string       // ISO 3166-1 alpha-2 (e.g. "IT")
  flag: string      // emoji flag
  name: string      // English name
  dial: string      // dial code WITH leading + (e.g. "+39")
}

// Curated default list — extend by passing `countries` prop if client demands.
export const DEFAULT_COUNTRIES: CountryDial[] = [
  { iso: "IT", flag: "🇮🇹", name: "Italy",        dial: "+39"  },
  { iso: "DE", flag: "🇩🇪", name: "Germany",      dial: "+49"  },
  { iso: "FR", flag: "🇫🇷", name: "France",       dial: "+33"  },
  { iso: "ES", flag: "🇪🇸", name: "Spain",        dial: "+34"  },
  { iso: "NL", flag: "🇳🇱", name: "Netherlands",  dial: "+31"  },
  { iso: "GB", flag: "🇬🇧", name: "United Kingdom",dial: "+44" },
  { iso: "AE", flag: "🇦🇪", name: "UAE",          dial: "+971" },
  { iso: "SA", flag: "🇸🇦", name: "Saudi Arabia", dial: "+966" },
  { iso: "US", flag: "🇺🇸", name: "United States",dial: "+1"   },
  { iso: "CA", flag: "🇨🇦", name: "Canada",       dial: "+1"   },
  { iso: "BR", flag: "🇧🇷", name: "Brazil",       dial: "+55"  },
  { iso: "MX", flag: "🇲🇽", name: "Mexico",       dial: "+52"  },
]

interface PhoneWithCountryProps {
  label?: string
  requiredText?: string | null
  name?: string                // base name, full submit gets `${name}` (e164-ish concatenation)
  value: string                // local part only (no dial code prefix), e.g. "612 345 678"
  countryIso: string           // selected ISO alpha-2
  onChange: (next: { value: string; countryIso: string; dial: string; e164: string }) => void
  countries?: CountryDial[]
  required?: boolean
  autoComplete?: string
}

export function PhoneWithCountry({
  label = "Phone number",
  requiredText = "required",
  name = "your-phone-visual",
  value,
  countryIso,
  onChange,
  countries = DEFAULT_COUNTRIES,
  required = true,
  autoComplete = "tel",
}: PhoneWithCountryProps) {
  const reactId = useId()
  const [focused, setFocused] = useState(false)

  const selected = useMemo(
    () => countries.find((c) => c.iso === countryIso) ?? countries[0],
    [countries, countryIso],
  )

  const hasValue = value.length > 0
  const lifted = focused || hasValue

  const emit = (nextValue: string, nextIso: string) => {
    const dial = countries.find((c) => c.iso === nextIso)?.dial ?? selected.dial
    const cleaned = nextValue.replace(/[^\d\s()-]/g, "")
    const digits = cleaned.replace(/\D/g, "")
    const e164 = digits ? `${dial}${digits}` : ""
    onChange({ value: cleaned, countryIso: nextIso, dial, e164 })
  }

  return (
    <div
      className={styles.wrap}
      data-state={lifted ? "lifted" : "rest"}
      data-focused={focused ? "true" : "false"}
    >
      <label htmlFor={`${reactId}-num`} className={styles.label}>
        <span className={styles.labelText}>{label}</span>
        {required && requiredText ? (
          <span className={styles.requiredHint}>{requiredText}</span>
        ) : null}
      </label>
      <div className={styles.row}>
        <select
          className={styles.country}
          name={`${name}-country`}
          aria-label="Country code"
          value={selected.iso}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => emit(value, e.target.value)}
        >
          {countries.map((c) => (
            <option key={c.iso} value={c.iso}>
              {c.flag} {c.dial} · {c.name}
            </option>
          ))}
        </select>
        <span className={styles.divider} aria-hidden="true" />
        <input
          id={`${reactId}-num`}
          className={styles.input}
          name={name}
          type="tel"
          inputMode="tel"
          autoComplete={autoComplete}
          required={required}
          value={value}
          onChange={(e) => emit(e.target.value, selected.iso)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder=""
        />
      </div>
    </div>
  )
}
