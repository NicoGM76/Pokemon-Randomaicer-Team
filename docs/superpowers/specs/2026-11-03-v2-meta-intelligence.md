# V2.2 Metagame Intelligence · Scope and Sources
**Date:** 2026-11-03
**Goal:** Add explainable, dated, lightweight competitive metagame snapshots and type-based matchups to the V2.1 hybrid builder.

## Verified public source
- Smogon monthly Pokémon Showdown **ladder**, chaos JSON.
- Singles: gen9ou, 1695 rating cutoff. Doubles: Pokémon Champions VGC 2026 Reg M-C, gen9championsvgc2026regmc, 1630 cutoff.
- The official Championship Series moved VGC competition to Pokémon Champions in 2026; tournament results have separate official sources.
- Never call ladder usage "Championship tournament usage". No implied live API on browser.
- Record period (YYYY-MM), ladder ID, rating cutoff, battle count if published, complete source URL, generation timestamp and caveats.
- Fetch snapshots in GitHub Actions at build/deploy and scheduled weekly (start with last finished month and fall back up to 3 months). Never combine different months or regulation IDs.
- Source data is transformed into lightweight per-format JSON in public/meta/, not imported into the initial app bundle. Persisting data on client is HTTP browser caching; no extra server/DB yet.
- Keep build deterministic for local checkouts without network via a checked-in no-data manifest; source sync command deliberately requires a successful source fetch to create an available snapshot. If refresh fails, deployment fails rather than silently publishing fabricated numbers.

## Data model
- Snapshot version, format, label, source organization, source URL, period, cutoff, number of battles, fetchedAt, sorted Pokémon records.
- Records: PokeAPI species ID matched strictly; real ladder usage percentage; ranked top moves/items/abilities/teammates from raw distribution, no ungrounded percentages for those fields.
- Unknown forms and alternate species names omitted rather than mapped to the incorrect base. Record matched vs dropped counts.

## UX
- Competitive section includes a lazy "Metagame y matchups" panel, off by default, so Aventura/Guardados do not download these snapshots.
- Show actual 2026 regulation label on doubles; do not claim legality in current tournaments.
- Top used Pokémon, click to see moves/items/teammates; analyze the user's team versus a common opposing Pokémon using defensive type chart, base types only.
- Show team members weak to enemy STAB and team types super effective against enemy's types; no win percentages, no guessed damage.
- Clear no-data/error states and source links. Restore V2.1 workspace without modification.

## Excluded
- Tournament/team roster ingestion, verified Championship match win rates, damage calculations, legality checks, adaptive meta-driven team generation, accounts and cloud sync.
- Future V2.2 incremental work can add actual tournament citations as a separate, clearly labeled dataset once sourced.
