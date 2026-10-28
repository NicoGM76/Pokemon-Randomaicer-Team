# Multiregion Collection V1 Design

## Goal
Add the final major V1 feature: generate several adventure teams for different selected games as one coordinated collection, avoiding repeated Pokémon/families across teams and supporting global locks and regional rerolls.

## Product shape
The generator has two top-level lines:
- Individual team: Adventure / Full Random / Custom.
- Team collection: Multiregion challenge.

Each collection entry selects:
- a target generation/region identity used to decide which evolution families naturally belong to that team;
- a concrete game used as the playable candidate pool;
- a team size.

The target generation and the game's technical generation are intentionally separate. This allows cases such as a Kanto team played in FireRed or Let's Go while still treating later evolutions by the origin of their family.

## Global collection rules
- No repeated Pokémon across teams.
- No repeated evolution families across teams.
- Prefer type diversity inside each team, but type repetition is a penalty rather than a hard ban.
- Prefer offensive coverage and physical/special balance through the existing Adventure scoring.
- Maximum one bonus Pokémon per team.
- Bonus is optional and should only be used if needed to complete a team.
- A later evolution belongs to the origin generation of its evolution family. Family origin generation is the minimum `introducedGeneration` among members of that family.
- Normal members come from the selected game's candidate pool and from families whose origin matches the target generation.
- Bonus candidates first come from the selected game's other families; if that cannot fill the team, the challenge may use a wider global candidate as the single clearly marked bonus.
- Generation-specific type-chart refinements remain an engine-quality follow-up; V1 collection reuses the current Adventure scorer rather than pretending generation-specific move coverage is already curated.

## Hybrid interaction
- Generate the full collection jointly.
- Lock an individual Pokémon.
- Lock an entire team.
- Regenerate one team while respecting all locked teams/Pokémon and global no-repeat rules.
- Regenerate the full collection while preserving locks.

## V1 boundaries
Included:
- 2-9 collection entries.
- Target generation/region plus concrete game selection per entry.
- 1-6 members per team.
- Global no-duplicate species/family.
- Optional one-bonus maximum per team.
- Team/member locks and regional reroll.
- Summary counters.

Deferred to V2:
- EVs, IVs, natures, held items, competitive movesets/formats.
- Fully curated offensive move coverage for every historical generation.
- Competitive team archetypes.
