// Owner feedback storage:
// (1) appended to in-memory list for current session
// (2) persisted in localStorage so refresh doesn't lose feedback
// (3) on click "Download" — generates .md blob and triggers browser save
//
// Production: feedback files land in workspace at
//   [rick.ai]/clients/all-clients/{client}/projects/{epic-id}/design-feedback/{YYYY-MM-DD}.md
// See skill `4-form-via-bottom-sheet` §Feedback storage.

export interface FeedbackEntry {
  ts: string             // ISO timestamp
  flagState: "native" | "rickform"  // which form was visible when feedback given
  url: string            // page url at time of feedback
  viewport: string       // e.g. "1280x800"
  comment: string        // owner's text
}

const STORAGE_KEY = "rickform.feedback.v1"

export function loadFeedback(): FeedbackEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as FeedbackEntry[]) : []
  } catch {
    return []
  }
}

export function saveFeedback(entries: FeedbackEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // localStorage full or disabled — silent
  }
}

export function appendFeedback(entry: FeedbackEntry): FeedbackEntry[] {
  const all = loadFeedback()
  all.push(entry)
  saveFeedback(all)
  return all
}

export function clearFeedback(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // silent
  }
}

function escapeMd(text: string): string {
  // Preserve content; just escape pipe characters that would break tables
  return text.replace(/\|/g, "\\|")
}

export function exportAsMarkdown(
  entries: FeedbackEntry[],
  meta: { client: string; epicId: string },
): string {
  const today = new Date().toISOString().slice(0, 10)
  const lines: string[] = []
  lines.push(`# Design feedback · ${meta.client} · ${meta.epicId}`)
  lines.push("")
  lines.push(`**Date:** ${today}`)
  lines.push(`**Entries:** ${entries.length}`)
  lines.push("")
  lines.push(
    `**Canonical path:** \`[rick.ai]/clients/all-clients/${meta.client}/projects/${meta.epicId}/design-feedback/${today}.md\``,
  )
  lines.push("")
  lines.push("## Entries")
  lines.push("")
  lines.push("| # | Time | Flag state | Viewport | URL | Comment |")
  lines.push("|---|------|------------|----------|-----|---------|")
  entries.forEach((e, i) => {
    const t = new Date(e.ts).toLocaleTimeString("en-GB")
    lines.push(
      `| ${i + 1} | ${t} | ${e.flagState} | ${e.viewport} | ${e.url} | ${escapeMd(e.comment)} |`,
    )
  })
  lines.push("")
  lines.push("## How to action this feedback")
  lines.push("")
  lines.push(`1. Save this .md file to the canonical path above (create \`design-feedback/\` folder if missing).`)
  lines.push(`2. Each entry maps to one concrete UI change in \`src/content/{contentKey}.tsx\` or shared components.`)
  lines.push(`3. After change applied, mark entry with ✅ in the markdown table and commit the .md alongside the code change in the same PR.`)
  lines.push(`4. Unresolved items roll over to next day's feedback file with status ⏳.`)
  return lines.join("\n")
}

export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
