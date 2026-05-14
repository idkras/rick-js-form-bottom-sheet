# tests/manual — RickForm bottom-sheet manual test suite

Per AGENTS.md §Release QA Gate (RCA 2026-04-16): каждый коммит в main UI-проекта
обязан сопровождаться `tests/manual/{YYYY-MM-DD}-{feature}.md` с JTBD + ≥10
manual cases + ≥6 corner cases + regression checks + visual verification + trust metric.

## Index

| Date | Feature | File | Pass% |
|---|---|---|---|
| 2026-05-14 | typhoon-coffee minimalist form (phone+country+2 chips) | [2026-05-14-typhoon-form-minimalist.md](./2026-05-14-typhoon-form-minimalist.md) | 74% (9 blocked) |

## How to run

1. Spawn subagent: `Agent({ subagent_type: "form-bottom-sheet-qa-engineer", prompt: "Run test plan from tests/manual/{date}-{feature}.md against localhost:4020" })`
2. Subagent uses Claude Preview MCP for screenshots + DOM probes
3. Verdict — Pass/Fail/Blocked per test case, screenshot in run-evidence
4. Owner re-checks visually using attached screenshot

## Trust metric (aggregate)

| Test class | Total | Pass | Fail | Blocked | %Pass |
|---|---|---|---|---|---|
| Manual T-cases | 19 | 14 | 0 | 5 | 74% |
| Corner C-cases | 8 | 4 | 0 | 4 | 50% |
| Regression R-cases | 7 | 7 | 0 | 0 | 100% |
| **Aggregate** | **34** | **25** | **0** | **9** | **74%** |

Blocked цели (T15-T19, C01-C02, C06-C07) — открыты как follow-ups F02-F05 на iteration 2.
