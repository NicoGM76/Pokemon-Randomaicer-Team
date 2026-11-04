# V2.2.x · Competitive Guided Editor Plan

## 1. Model, rules and migrations
- [ ] Tests: different EV/PC limits, set conversion without data loss, defaults, Tera only SV and Mega only Champions.
- [ ] Extend `core/types.ts` and `core/trainingRules.ts`; update `validation.ts`, `teamBuilder.ts`, `competitiveDraft.ts` with backward-compatible optional fields.
- [ ] Verify green unit tests; commit.

## 2. Searchable data assistance
- [ ] Tests: Pikachu ability whitelist, version-specific moves, no fabricated game legality, names normalization/caching and fallbacks.
- [ ] `assist/pokemonProfile.ts` loads PokeAPI species/variety/move/ability list as lightweight on-demand client. `assist/items.ts` curated canonical items with Spanish labels.
- [ ] UI `AssistSelect.tsx` searchable list for items and moves, strict selector for abilities, forms and auto Megastone.
- [ ] Verify tests; commit.

## 3. UI and language
- [ ] Global ES-ES and ES-419 in navigation; localStorage and test.
- [ ] Independent format/game controls in CompetitiveLandingPage; rewrite EV/PC display, IV gating, tera, forms, move/item/ability inputs.
- [ ] Responsive CSS and tests for live selection + draft reload.
- [ ] Verify all tests; commit.

## 4. Docs and PR
- [ ] README caveats and sources.
- [ ] Final CI sync/validate/tests/build and review; open PR without merge.
