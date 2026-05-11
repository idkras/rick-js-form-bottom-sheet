# rick-js-form-bottom-sheet

**Generic `<RickSheet>` container (mobile = bottom-sheet with gestures, desktop = centered popup) + content plugin registry. Companion to [`rick-js-bottom-sheet-stripe`](https://github.com/idkras/rick-js-bottom-sheet-stripe) but for HTML lead forms instead of Stripe payment.**

First client: **typhoon.coffee** (BU 16320). See parent project `pr-rick-7r1` in `heroes-rickai-workspace` workspace.

## Why

Clients (typhoon-coffee, others) have their own HTML lead forms (Contact Form 7, custom, etc). We want to A/B-test form copy / fields / mobile UX **without touching the client's website code**. One AppCraft `add_code` rule hides the original form, loads `rick-form.js` bundle, and renders our `<RickSheet>` with a 1:1 copy of the form. Submit payload routes through `flow.rick.ai/webhook/snippetFormHook` → CRM.

Constraint: Rick.js Snippet runtime supports `add_code`, **not** `add_block` ([Standard 4.12 §3](https://github.com/idkras/heroes-rickai-workspace)). So we ship a JS bundle that exposes `window.RickForm.open({...})`, same pattern as `RickPay.stripe.open({...})`.

## Public API

```js
// Loaded via <script src="https://rick-js-form-bottom-sheet.vercel.app/rick-form.js" async>
window.RickForm.open({
  contentKey: "typhoon-contact-form-2026-05-11",  // hypothesis date, NOT vN
  title: "Get a Free Consultation",
  mode: "auto",         // "auto" | "sheet" | "popup"
  config: { /* opaque, passed to content plugin */ },
  callbacks: {
    onSubmit: (values) => { /* forward to flow.rick.ai webhook */ },
    onClose:  ()        => { /* analytics */ },
  }
})

window.RickForm.close()
window.RickForm.content.register(contentKey, ReactComponent)  // add new client form
window.RickForm.content.list()  // → ["typhoon-contact-form-2026-05-11", ...]
```

## Architecture (layers)

| Layer | File | Role |
|---|---|---|
| 1. Container | `src/components/rick-sheet.tsx` | Generic `<RickSheet>` — mode=auto (media query) → mobile bottom-sheet (drag-down close, snap points) or desktop centered popup. a11y: focus trap, Esc, role=dialog. |
| 2. Content registry | `src/registry.ts` | `RickFormRegistry.{register, resolve, list}` — content keys keyed by hypothesis date (`{slug}-YYYY-MM-DD`). |
| 3. Public API | `src/rick-form.tsx`, `src/standalone.tsx` | `window.RickForm.open({...})` — imperative mount, queue-drain support for early `rickFormQueue` pushes from `add_code`. |
| 4. UI primitives | `src/components/{chip-selector,text-field}.tsx` | shadcn ToggleGroup-style pill chips (replaces wpcf7 radio); accessible text/textarea inputs. |
| 5. Content plugins | `src/content/typhoon-contact-form-2026-05-11.tsx` | 1:1 copy of typhoon.coffee /contacts/ form. New client = new file, same pattern. |
| 6. Demo | `src/demo/`, `test-widget.html` | Dark-shell configurator + static harness for local QA. |

## Naming convention

Per skill `1-project-create-launch` §Naming convention:

- `contentKey` = `{client}-{form-slug}-{YYYY-MM-DD}` — date of hypothesis, **not** `vN`
- `form_name` in submitted payload = same convention
- Date encodes "from what baseline is this A/B variant measured"

Example:
- ✅ `typhoon-contact-form-2026-05-11`
- ✅ `vipavenue-quick-buy-2026-05-25`
- ❌ `typhoon-contact-form-v1`
- ❌ `vipavenue-quick-buy-v2`

## Scripts

```bash
npm install
npm run dev           # Vite dev server on http://localhost:4020 — interactive demo configurator
npm run build         # IIFE widget bundle → public/rick-form.js
npm run build:demo    # static demo build for Vercel
npm run preview       # serve built demo locally
```

## Local QA

1. `npm install && npm run build` — produces `public/rick-form.js`
2. Serve repo root over any static server: `npx serve .` (or `python3 -m http.server 4020`)
3. Open `http://localhost:4020/test-widget.html` — click "Open typhoon contact form"
4. Test mobile mode: Chrome DevTools device toolbar → iPhone SE → reload; verify drag-down close + safe-area bottom inset
5. Test desktop mode: width > 768px → centered popup, backdrop click → close, Esc → close

## Deploy

- Vercel project autodeploys from `main`
- Public URL of the bundle: `https://rick-js-form-bottom-sheet.vercel.app/rick-form.js`
- Static demo: `https://rick-js-form-bottom-sheet.vercel.app/`

## Adding a new client

1. Create `src/content/{client}-{form-slug}-{YYYY-MM-DD}.tsx`
2. Define React component implementing `RickFormContentProps`
3. End the file with: `RickFormRegistry.register("{client}-{form-slug}-{YYYY-MM-DD}", Component)`
4. Import it from `src/standalone.tsx` so the side-effect runs at bundle load
5. `npm run build` → push → Vercel redeploys
6. In AppCraft for the client BU, add `add_code` rule with CONFIG `{ contentKey: "{client}-{form-slug}-{YYYY-MM-DD}", hideSelector: "form.their-form", triggerSelector: "a.cta", payload: {...} }` — see skill `4-rick-js-bridge-create-and-deploy` for the universal-bridge template

## ChipSelector design reference

Pill chips per owner screenshot 2026-05-11 — replaces wpcf7 radio buttons (typhoon `cstatus`) and `<select>` (typhoon `current-status`) with a more readable mobile-friendly control:

- Default chip: white bg, 1px gray border, dark text, radius full
- Selected chip: dark bg (#0a0a0c), white text, check-circle icon left of label
- Wrap with 8px gap when row overflows
- Equivalent to shadcn/ui `ToggleGroup type="single"` — implementation is vanilla CSS modules to keep bundle deps minimal; migrate to `@radix-ui/react-toggle-group` if a11y/keyboard arrow nav across chips required

## Roadmap

- [ ] Pixel-perfect visual diff vs typhoon.coffee baseline (Playwright screenshots vs `landing-capture-2026-05-11/`)
- [ ] Migrate gesture engine from custom touch handlers to `pure-web-bottom-sheet` npm package (parity with rick-js-bottom-sheet-stripe)
- [ ] `<FormRenderer schema={...}>` — declarative content plugin (closes Generalization-first Q4 from `pr-rick-7r1`)
- [ ] i18n hooks (typhoon baseline is EN, future clients may need RU/multi-locale)
- [ ] Integration test: rick.js bridge → flow.rick.ai webhook 200 → CRM record present
