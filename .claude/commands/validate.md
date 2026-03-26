Run full project validation:
1. TypeScript compiler check (tsc --noEmit)
2. ESLint across src/
3. Check all faction JSON files conform to src/types/faction.ts schema
4. Check all special_rule IDs in faction files exist in src/data/rules/special-rules.json
5. Report any issues found; do not auto-fix without asking
