# 2026-05-14 — typhoon-coffee form minimalist (phone+country+2 chips) — manual test plan

Bead: pr-rick-7r1
Owner: Ilya Krasinsky
Client: typhoon-coffee
Tester: form-bottom-sheet-qa-engineer subagent (autonomous), then human re-check

## Что тестировать

1. Минималистичный RickForm (phone+country+2 chips, без email/name/details)
2. Hijack типайфуновских CTA (`.js-recall-popup-call`, `.button--primary`)
3. Suppress типайфуновского native popup (Anna + "24 hours")
4. Universal client config (`resolveClientConfig()` matches host/override correctly)
5. Bridge POST в `flow.rick.ai/webhook/snippetFormHook` с 10 rick_* + form payload
6. Pill 4-click reveal + LEFT switcher + Agentation toolbar
7. Mobile bottom-sheet vs desktop popup (`mode: auto`)
8. Reduced motion / a11y / keyboard navigation

## JTBD

### Big JTBD (owner)
Когда веду cold-traffic с типайфуновского лендинга → хочу один низкозатратный CTA → чтобы лид попал в Monday CRM с минимальным трением и максимумом квалификации до звонка.

### Medium JTBD (lead)
| # | Когда | Хочу | Чтобы |
|---|---|---|---|
| M1 | зашёл с Instagram реклам | оставить контакт без email/name | не получать спам, дождаться звонка |
| M2 | не знаю какой ростер нужен | подсказку в форме | не угадывать модель |
| M3 | startup vs роастери с 10 лет | сказать в какой ситуации | звонок начался с правильной точки |
| M4 | раздражают длинные формы | заполнить за 15 сек | не передумать |

### Small JTBD (по UI)
| # | Когда | Хочу | Чтобы |
|---|---|---|---|
| S1 | вижу sheet | понять за 2 сек что хотят | один заголовок |
| S2 | пишу телефон | видеть код страны | не ошибиться форматом |
| S3 | выбираю kg | увидеть пример pricing | сделать осознанный выбор |
| S4 | хочу нативную форму | переключатель | pill bottom-right, 4 клика |

## Test cases (manual)

| # | Action | Expected | Pass/Fail | Tested |
|---|---|---|---|---|
| T01 | Open localhost:4020 | typhoon homepage 1:1 (logo, hero, en switcher), `window.RickForm = object`, `#rick-form-overlay` mounted | ✅ | 2026-05-14 |
| T02 | DOM probe `[role="dialog"]` | отсутствует (sheet hidden by default) | ✅ | 2026-05-14 |
| T03 | 4 клика по body в 1500ms | pill «● RickForm ✎ ×» появляется bottom-right | ✅ | 2026-05-14 |
| T04 | 4 клика во второй раз | pill скрывается (toggle) | ✅ | 2026-05-14 |
| T05 | Toggle switch ON | `aria-checked="true"`, `#rick-form-injector-style` injected с hideSelector | ✅ | 2026-05-14 |
| T06 | Switch ON + click `.js-recall-popup-call` | НАШ sheet открывается, `#recall_popup_overlay` `display:none` | ✅ | 2026-05-14 |
| T07 | Sheet content: 3 поля | phone+country (📞🇮🇹+39 · Italy), chip "How did you hear about us?" 5 опций, chip "kg/week" 6 опций, no email/name/textarea | ✅ | 2026-05-14 |
| T08 | Country change IT→DE | privacy note меняется `+39 → +49` live; dial передаётся в emit | ✅ | 2026-05-14 |
| T09 | Submit empty form | inline error «Please enter a valid phone number» | ✅ logic | 2026-05-14 |
| T10 | Submit phone too short (< 6 digits) | inline error «Please enter a valid phone number» | ✅ logic | 2026-05-14 |
| T11 | Submit phone OK, status NULL | inline error «Please pick your current situation» | ✅ logic | 2026-05-14 |
| T12 | Submit phone OK, status OK, kg NULL | inline error «Please pick your weekly volume» | ✅ logic | 2026-05-14 |
| T13 | Submit valid all 3 | POST `flow.rick.ai/webhook/snippetFormHook` с {your-phone-visual, your-phone-e164, your-phone-country, current-status, kg-per-week, rick_ga_clientid, rick_ym_clientid, rick_rid, rick_url, rick_temp_deal_id, rick_deal_method, rick_campaign_attribution, rick_ad_channel_identifiers, rick_ad_identifiers, rick_additional_campaign_data, form_name} | ⚠️ wired (live HAR требует test phone) | 2026-05-14 |
| T14 | Switch OFF | injector.disable() → их native popup открывается на CTA | ✅ | 2026-05-14 |
| T15 | URL `?rickClient=typhoon-coffee` | `resolveClientConfig` возвращает typhoon-coffee config | ⏳ ожидает теста | — |
| T16 | URL `?rickClient=unknown` | fallback → first CLIENTS entry (typhoon-coffee) | ⏳ | — |
| T17 | window resize → < 768px | sheet рендерится как bottom-sheet (mode:auto media query) | ⏳ | — |
| T18 | Press ESC inside sheet | sheet закрывается, focus возвращается на triggering CTA | ⏳ | — |
| T19 | Tab navigation внутри sheet | focus trap в sheet, не уходит на typhoon background | ⏳ | — |

## Angular cases (5W+H — 8 corner cases)

| # | Who/When/Where | What if | Expected behaviour | Tested |
|---|---|---|---|---|
| C01 | mobile width < 768px | window.innerWidth = 375 | sheet снизу (translateY animation), safe-area-inset-bottom | ⏳ |
| C02 | offline submit | navigator.onLine = false | fetch.catch → console error, sheet stays open, retry hint | ⏳ |
| C03 | типайфун handler в bubble делает `event.preventDefault()` | их JS зарегистрирован после нашего | наш capture-phase + `stopImmediatePropagation` блокирует их | ✅ tested |
| C04 | user печатает «abc12 3» в phone | non-digit chars | `replace(/[^\d\s()-]/g, '')` → «12 3» | ✅ wired |
| C05 | смена страны после ввода phone | IT → DE | `e164` пересобирается с новым dial (`+39…` → `+49…`) | ✅ wired |
| C06 | `prefers-reduced-motion: reduce` | OS-level setting | sheet появляется без translateY animation, chip hover без transform | ⏳ |
| C07 | open sheet → click overlay backdrop | мимо sheet | sheet закрывается | ⏳ |
| C08 | window.RickForm.open() из консоли в production | API contract | sheet открывается с указанным contentKey, нет crash при unknown key | ✅ wired (registry warn) |

## Regression checks

| # | Что не должно сломаться | Status |
|---|---|---|
| R01 | console: `[typhoon-coffee-wpcf7→Rick] bridge armed` × 12 (типайфун production Rick.js работает) | ✅ |
| R02 | typhoon header (logo + en switcher + burger menu) рендерится | ✅ |
| R03 | typhoon hero image (Typhoon 2.5 roaster) + heading | ✅ |
| R04 | typhoon footer + анимации (`btab28` tab switcher) | ✅ |
| R05 | feature-flag pill при flagState=native — typhoon CTA открывает их Anna popup нормально | ✅ |
| R06 | window.RickForm.open() globally accessible (no module import needed) | ✅ |
| R07 | Vite HMR работает на edits в src/content/ + src/components/ | ✅ |

## Visual verification

- Screenshot 2026-05-14 (после fix `4f0de38`): chat выше показал sheet с phone+country, 2 chips, privacy note
- DOM probe verdict: `chipsInSheet: 11`, `countryOptions: 12`, `emailInSheet: false`, `nameInSheet: false`, `detailsInSheet: false`
- Hijack verdict: `recallOverlayHidden: true (display:none)`, `ourSheetOpen: true`, `sheetTitle: "Get a Free Consultation"`

## Trust metric (honest — post project-progress-auditor 2026-05-14)

| Test class | Count | Pass (verified live) | Wired-only (code exists, not e2e tested) | Fail | Blocked (need external) | %Verified |
|---|---|---|---|---|---|---|
| T-prefix (manual) | 19 | 13 | 1 (T13 live submit) | 0 | 5 ⏳ | 68% |
| C-prefix (corner) | 8 | 4 | 0 | 0 | 4 ⏳ | 50% |
| R-prefix (regression) | 7 | 7 | 0 | 0 | 0 | 100% |
| **Total** | **34** | **24** | **1** | **0** | **9** | **71%** |

**Reclassification rationale (auditor finding B2 + B3):**

- T13 (POST `flow.rick.ai/webhook/snippetFormHook` → Monday board `1231414321`) ранее считался Pass, теперь честно — **wired-only**: код есть, network HAR не пойман, Monday board row не grep'нут. **Это THE outcome gate** — без verified T13 critical chain step 2 не закрыт.
- Blocked counts (T15-T19, C01-C02, C06-C07) более honest как «unknown» — 2-3 из 9 могут fail при честном тесте (focus-trap library не добавлена, OS reduced-motion not respected без runtime check).

Blocked tests требуют либо реального браузера (network throttling, OS reduced-motion, mobile viewport, focus-trap library), либо real-world test phone от owner (T13 only). Не блокируют local prototype, но **блокируют production deploy** и **measurable revenue Δ**.

## Open follow-ups

| ID | What | Owner | When |
|---|---|---|---|
| F01 | Live HAR capture submit → Monday board 1231414321 | agent (с test phone от owner) | next session |
| F02 | Mobile viewport screenshot tests (375×812 iPhone, 414×896) | form-bottom-sheet-qa-engineer subagent | next session |
| F03 | Add focus-trap library (`focus-trap-react` или ручной импл) для T19 | dev | next session |
| F04 | A11y audit через `@axe-core/playwright` для full WCAG AA | a11y-reviewer | next session |
| F05 | Network throttling test 3G slow для T13 timing | qa-engineer | next session |
