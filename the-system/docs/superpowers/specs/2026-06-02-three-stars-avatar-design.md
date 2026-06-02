# The Three Stars — Avatar Redesign

Date: 2026-06-02

## Goal

Replace the single generic coral spark avatar with three visually distinct
"stars" — **Antares**, **Polaris**, **Altair** — matching the existing
`HeroClass` → star labels (Warrior/Mage/Rogue). Each star has its own silhouette,
color, and signature motion. Progress (rank E→S) layers visible effects on top.
Show an animated star preview in each "SELECT YOUR STAR" onboarding card.

## Current state

- `HeroClass = 'Warrior' | 'Mage' | 'Rogue'`; `STAR_LABELS` maps them to
  Antares/Polaris/Altair (`src/types/index.ts`).
- Avatar render = `ClaudeSpark` (coral ray-burst) scaled by rank; near-identical
  for all three classes. Wrapped by `AvatarDisplay` (used in CommandHall, Mirror).
- `Awakening` select-star cards are text-only (label + description).

## Design

### New component: `src/components/avatar/StarAvatar.tsx`

Props: `{ heroClass: HeroClass; rank: string; size?: number; previewIntensity?: 'E'|'D'|'C'|'B'|'A'|'S' }`.

- `previewIntensity` (optional) overrides rank — used by the cards to render a
  fixed mid "C" look pre-game. When absent, uses `rank`.
- Renders react-native-svg. Animations via `Animated` (useNativeDriver).
- Self-contained: no rank-ramp logic leaks to callers.

### Star identities (warm-tuned real colors)

- **Antares** (Warrior) — red supergiant. Large round glowing disc that
  **pulses (breathing scale)**, broad soft red-orange flares.
  Core `#E0623C`, tip `#F0875A`, glow `#FF7A4D`.
- **Polaris** (Mage) — fixed north star. Crisp **4-point star + faint guiding
  cross** (long vertical/horizontal beams), gold-white. Steady, minimal spin;
  small "lesser stars" sit around it at higher ranks.
  Core `#FBE3B0`, tip `#E8C879`, glow `#FFE9A8`.
- **Altair** (Rogue) — fast eagle star. Sleek star with two **swept-back rays
  like wings**, muted silver-blue. Quick shimmer + light spin.
  Core `#CFE0EC`, tip `#9FB8CC`, glow `#B8D0E4`.

### Rank → effect ramp (shared, layered on each identity)

| Rank | Added effect |
|------|--------------|
| E | base star, dim (opacity ~0.7) |
| D | brighter core + soft glow halo |
| C | full halo + faint inner ring |
| B | + 1–2 orbiting motes + gentle pulse |
| A | + spin/shimmer enabled + stronger flares, brighter tips |
| S | + full corona burst, multiple orbiting motes, max glow |

Implemented as a numeric `tier = rankToArmorTier(rank)` (E=1…S=5) plus per-rank
booleans (`halo`, `ring`, `motes`, `spin`, `corona`). Each star reads these flags
and adds the corresponding SVG layers / animations.

### Integration

- `AvatarDisplay` swaps `ClaudeSpark` → `StarAvatar` (CommandHall, Mirror update
  automatically; existing `mood` opacity behavior preserved).
- `Awakening` select-star cards: render `<StarAvatar heroClass={c.name}
  previewIntensity="C" size={48} />` left of the label/description. Card layout
  becomes a row (star | text).
- `ClaudeSpark` left in place (now unused) — optional later cleanup.

## Non-goals

- No new persisted data; rank already drives effects.
- No change to class selection logic / store.
- Altair stays muted (no bright cyan) to respect the warm aura reskin.

## Testing / verification

- Typecheck clean.
- Release build to device; verify: (1) three cards show distinct animated stars,
  (2) CommandHall/Mirror avatar matches selected star, (3) effects visibly grow
  with rank (compare E vs higher via screenshots).
