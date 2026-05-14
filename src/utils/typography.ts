// Typography helpers — non-breaking spaces between prepositions, числами +
// единицами, инициалами и т.п. Per workspace skill 0-typography-non-breaking-spaces.
//
// Применение в JSX:
//   <label>Phone number{NBSP_NARROW}<em>required</em></label>
//   <p>{fixSpaces("Roast 5 kg per week ≈ 500 cups")}</p>

export const NBSP = " "           // U+00A0 non-breaking space
export const NBSP_NARROW = " "    // U+202F narrow no-break space

// Russian + English short prepositions/connectors that should glue to next word
const SHORT_PREPS_RE = /(\s|^)([вкоусяиаВКОУСЯИА]|of|to|at|by|in|on|the|a|an)\s/gi

// Number + unit pairs (Russian + English)
const NUM_UNIT_RE =
  /(\d)\s+(кг|kg|г|gr|°C|€|\$|₽|cup|cups|шт|pcs|ml|L|sec|min|h|hours|days|weeks|months|years|%)/g

// Standard abbreviations followed by a word
const ABBR_RE = /\b(г\.|гр\.|тыс\.|млн\.|руб\.|им\.|тел\.|стр\.|см\.)\s/g

// Em/en dash — should not start a new line by itself
const DASH_RE = /\s+([—–])/g

// Full-width spaces / leftover characters cleanup
const MULTI_SPACE_RE = /[ \t]{2,}/g

export function fixSpaces(input: string): string {
  if (!input) return input
  return input
    .replace(SHORT_PREPS_RE, (_m, lead, w) => `${lead}${w}${NBSP}`)
    .replace(NUM_UNIT_RE, `$1${NBSP}$2`)
    .replace(ABBR_RE, `$1${NBSP}`)
    .replace(DASH_RE, `${NBSP}$1`)
    .replace(MULTI_SPACE_RE, " ")
}

// Tight space между label словом и required-hint (узкий, не обычный space)
export function tightLabelHint(label: string, hint: string | null | undefined): string {
  if (!hint) return label
  return `${label}${NBSP_NARROW}${hint}`
}
