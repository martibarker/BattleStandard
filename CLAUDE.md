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

## What Claude Must NOT Do
- Do not install dependencies not listed above without asking first
- Do not create API calls to external services in Phase 0–2
- Do not hardcode any army data, points values, or rules text in components
- Do not use localStorage (use IndexedDB via a wrapper or Zustand persist)
- Do not use arbitrary Tailwind values (e.g. w-[347px]) — use standard scale only
