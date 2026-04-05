# Battle Standard — Claude Code Project Context

## What This Is
Battle Standard is a free Progressive Web App (PWA) for Warhammer: The Old World players.
It combines an army builder, rules reference, turn tracker, and FAQ repository.
It is entirely unofficial and not affiliated with Games Workshop.

## Tech Stack
- React 18 + TypeScript (strict)
- Vite (build tool)
- Tailwind CSS (utility styling — core classes only, no JIT compiler)
- Zustand (state management)
- React Router v6 (routing)
- PDF.js (in-app PDF rendering) — Phase 3+
- Workbox (service worker / PWA) — Phase 6
- Hosted on Cloudflare Pages
- Backend (Phase 4+): Cloudflare Workers + D1

## Key Conventions
- All components: functional, typed props, no `any`
- State: Zustand stores in `src/store/`; no prop drilling
- Data: static JSON in `src/data/`; never hardcode game data in components
- Army rules: special rule names in unit data are string IDs resolved to the rules index at render
- Base sizes: always displayed in the list view; stored in the unit JSON as `baseSize`
- Validation: live percentage checks (Lords ≤25%, Heroes ≤25%, Core ≥25%, Special ≤50%, Rare ≤25%)
- Offline first: all core features must work with no network connection

## Design Language
- Dark theme; deep navy/charcoal backgrounds
- Amber (#D97706) and steel blue (#60A5FA) as primary accents
- Font: Cinzel (headings), Inter (body)
- Minimum 18px body text; minimum 32px on key turn tracker values
- Tailwind core classes only — no arbitrary values

## Attribution (must appear in UI)
- Rules index: Warhammer Fantasy Online Rules Index Project (tow.whfb.app / whfb.app)
- Disclaimer: "Unofficial. Not endorsed by Games Workshop Limited."
- Data icons: game-icons.net (CC BY 3.0)

## Current Phase
Phase: 0 — Project scaffold

## Database Layer (Source of Truth)
`db/battlestandard.sqlite` is the canonical source of truth for all faction data. **Do NOT hand-edit faction JSONs or magic-items.json directly.**

| Task | Command |
|------|---------|
| Visual DB editor | `npm run db:studio` |
| Regenerate JSONs from DB | `npm run db:export` |
| Re-seed DB from JSONs | `npm run db:import` |
| Post-import sanity check | `npm run db:validate` |
| FAQ/errata workflow | Studio → export → review diff → commit both `.sqlite` + JSONs → deploy |

**Lore keys** use snake_case throughout (`lore_of_gork`, `battle_magic`). The `src/utils/magic.ts` utility converts these to kebab-case for `lores.json` lookups at runtime. Do not mix formats.

**Deployment rules** (ambushers, scouts, vanguard) may come from three sources — always check all three when implementing General's Adjutant eligibility:
1. `units.special_rules` (unit-level)
2. `magic_items.grants_rules` (equipped item)
3. `composition_rules.grants_rules` / `army_compositions.grants_rules` (list selection)

**lores.json** (`src/data/lores.json`) is managed separately and is NOT touched by `db:export`. It is used by General's Adjutant for rich spell data (flavour text, spell numbers). Reconciliation with the DB's `spells` table is a future task.

## Data Sources & Reference Files

### Step 1 — Always check extracted reference files first
`src/docs/unit-reference/` contains compact JSON extracts of the source PDFs. **Use these before touching any PDF.** They are the token-efficient source of truth for unit stats, points, and options.

| File | Coverage | Status |
|------|----------|--------|
| `forces-of-fantasy.json` | Empire, Bretonnia, High Elves, Wood Elves, Dwarfs — all unit stats + points | ⬜ not yet created |
| `ravening-hordes.json` | Orcs & Goblins, Warriors of Chaos, Beastmen, Tomb Kings — all unit stats + points | ⬜ not yet created |
| `arcane-journals.json` | All AJ sub-lists, special rules, additional units | ⬜ not yet created |

`src/docs/pdf-summaries/*.md` — army composition rules only (no unit stats). Useful for % limits and per-1000-pt restrictions but **do not trust for individual unit stats**.

### Step 2 — Only open a PDF if the reference file doesn't cover what you need
PDF base path: `/Users/martibarker/Library/CloudStorage/ProtonDrive-marti.barker@pm.me-folder/Hobby/Warhammer Books/The Old World/`

| Book | Filename |
|------|----------|
| Forces of Fantasy | `Forces of Fantasy/TOW - Forces of Fantasy.pdf` |
| Ravening Hordes | `Ravening Hordes/TOW - Ravening Hordes.pdf` |
| AJ — Empire of Man | `Forces of Fantasy/WHTOW - Arcane Journal - Empire of Man .pdf` |
| AJ — Kingdom of Bretonnia | `Forces of Fantasy/Arcane Journal - Kingdom of Bretonnia.pdf` |
| AJ — High Elf Realms | `Forces of Fantasy/WHTOW - Arcane Journal - High Elf Realms.pdf` |
| AJ — Wood Elf Realms | `Forces of Fantasy/WHTOW - Arcane Journal - Wood Elf Realms.pdf` |
| AJ — Dwarfen Mountain Holds | `Forces of Fantasy/Arcane Journal - Dwarfen Mountain Holds.pdf` |
| AJ — Orc & Goblin Tribes | `Ravening Hordes/Arcane Journal - Orc and Goblin Tribes.pdf` |
| AJ — Warriors of Chaos | `Ravening Hordes/Arcane Journal - Warriors Of Chaos.pdf` |
| AJ — Beastmen Brayherds | `Ravening Hordes/WHTOW - Arcane Journal - Beastmen Brayherds .pdf` |
| AJ — Tomb Kings of Khemri | `Ravening Hordes/Arcane Journal - Tomb Kings of Khemri.pdf` |
| TOW Rulebook | `The Old World Rulebook.pdf` |
| TOW FAQ | `TOW FAQ.pdf` |
| Matched Play Guide | `TOW Matched Play Guide .pdf` |
| FoF FAQ (Jun 2025) | `Forces of Fantasy/eng_jun25_whtow_fof_faq-mx6flwcirp-5setdw8pp6.pdf` |
| RH FAQ | `Ravening Hordes/RH FAQ.pdf` |

**tow.whfb.app** — live WebFetch only (no local copy). Use as tertiary check only.

### Step 3 — After reading a PDF, always save the extracted data
When you extract unit data from a PDF, save it to `src/docs/unit-reference/` immediately so the next session doesn't need to re-read the PDF. Use pdfplumber:
```python
import pdfplumber
with pdfplumber.open("/full/path/to/file.pdf") as pdf:
    for i, page in enumerate(pdf.pages):
        text = page.extract_text()
        if text:
            print(f"=== PAGE {i+1} ===\n{text}\n")
```
Node/npx not on PATH in sandboxed shells — use `/opt/homebrew/bin/node` explicitly.

### Faction JSON Convention
All unit data lives in `src/data/factions/<faction-id>.json`. Key rules:
- Cavalry/chariot units use `profiles` array + `equipment: { rider/crew: [...], mount: [...] }`
- Characters and solo units use flat `stats` object (normalizeFaction in `src/data/factions/index.ts` converts this to `profiles`)
- Mount M value goes in the **first** profile's `M` field (the rider/chariot body row), not `"-"`
- `is_mount: true` on the mount's profile entry

## What Claude Must NOT Do
- Do not install dependencies not listed above without asking first
- Do not create API calls to external services in Phase 0–2
- Do not hardcode any army data, points values, or rules text in components
- Do not use localStorage (use IndexedDB via a wrapper or Zustand persist)
- Do not use arbitrary Tailwind values (e.g. w-[347px]) — use standard scale only
