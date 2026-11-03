# V2.2 Metagame Intelligence Plan
1. [ ] Define schema and tests for raw chaos conversion, source labels, missing names, data validation.
2. [ ] Implement Node script to fetch a dated Smogon snapshot independently for each format, with strict counts and safe month fallback; output public/meta/*.json.
3. [ ] Implement type-based matchup function with unit tests, explicitly no winner probability.
4. [ ] Create lazy-loaded metagame UI, error/loading and empty states, visible sources, responsive layout, stats selectors, learning explanations.
5. [ ] Update GitHub Pages pipeline and weekly schedule, keep CI offline unit test deterministic, document provenance and limitations.
6. [ ] Verify fresh CI, inspect real snapshot generation and page bundle sizes, open PR to main without merging.
