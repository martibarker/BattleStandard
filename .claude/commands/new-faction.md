Create a new army faction data file for Battle Standard.
- Location: src/data/factions/[faction-id].json
- Follow the schema in src/types/faction.ts exactly
- Every unit must have: id, name, category, baseSize, profile, equipment, options, special_rules (as ID strings), points
- Special rule names must be IDs matching src/data/rules/special-rules.json
- Do not include rule descriptions in the faction file — rules resolve from the index
- Validate the JSON is well-formed before finishing
