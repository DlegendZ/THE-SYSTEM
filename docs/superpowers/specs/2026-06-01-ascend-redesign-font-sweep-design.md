# Ascend Redesign + Font Sweep — Design

**Date:** 2026-06-01
**Scope:** Front-end only. Two pieces: (1) redesign the Ascend (`AscensionPath`) screen into a Claude "constellation spark trail"; (2) finish the Claude typography system across every remaining text element. No engine/data/store changes — Ascend still reads `getWeekCompletionRate` for 24 weekly nodes.

## Decisions (locked with user)

- Ascend direction: **constellation spark trail** (journey-map feel, not cards/dashboard).
- Font scope: **finish the system everywhere** — keep Lora serif headings + Inter body (the Claude pattern), apply it to every element still missing it, and sentence-case all leftover ALL-CAPS (incl. player nameplate). Body stays Inter (NOT all-serif).

## Part 1 — Ascend "constellation spark trail" (`src/screens/AscensionPath.tsx`)

### Nodes — replace `NodeSvg` (hex + 🔒) with a spark renderer
A new local `TrailNode` (or extend usage of `ClaudeSpark`) renders per-week state:
- **Completed** (past week, rate ≥ 0.5): small filled coral spark (~40px), soft glow, week number + % beneath.
- **Current week**: large spark (~64px) with a pulsing halo ring (reuse existing `pulseAnim`), brightest — tip coral→gold. "You are here."
- **Past low** (past, rate < 0.5): dim/outline spark (attempted, not mastered), muted color.
- **Locked** (future week): faint dotted ring outline, dim week number, NO emoji lock.
- ClaudeSpark gains an optional `glow?: boolean` (renders a soft radial halo behind rays) and reuses the existing `tint?` prop for state color. Sizes parameterized.

### Trail connectors
Soft **dotted** warm connector meandering left/right between nodes (keep the alternating zig-zag layout). Coral (`accent`) on unlocked segments, faint warm-grey (`#3A3733`) on locked. A faint vertical gradient "spine" behind the column (low-alpha accent).

### Zones (6, every 4 weeks)
- Replace `ZONE_COLORS` near-black values with **warm charcoal tints that warm/brighten by zone index** (Abyss deepest → Throne gold-touched). Each derived from the charcoal base with a rising warm/accent low-alpha overlay; must stay subtle and readable on `theme.background`.
- `ZONE_LABELS` → Title Case lore names ("The Abyss", "Ruined Kingdom", "Iron Citadel", "Celestial Gate", "Void Expanse", "The Throne"). Rendered in **Lora serif** (`FONTS.display`), centered, thin warm divider both sides + a small spark gem (small SVG burst) instead of the plain line.

### Header (polish, keep structure)
"Ascension Path" already Lora — keep. Coral week badge `n / 24`, warm progress bar (`headerBarBg` `#111` → `theme.primary`/`#2A2725`), "{avg}% avg" sentence case (was "% AVG").

### Node detail modal
- Card bg `#050505` → warm charcoal `#2C2B28`.
- "Week n" stays Lora; zone label Title Case; lore rendered **serif italic** (`fontFamily: FONTS.displayRegular, fontStyle: 'italic'`).
- Status values `NOW`/`LOCKED`/`DONE` → "Now"/"Locked"/"Done". Stat labels already sentence case.
- Close button already "Close".

### Hardcoded cold neutrals to warm in this file
`#111`, `#0a0a0a`, `#333`, `#444`, `#2a2a2a`, `'#050505'` → warm equivalents (`theme.primary`, `#2A2725`, `#3A3733`, `#6B6A65` as appropriate). Lock emoji removed.

## Part 2 — Font sweep "finish everywhere"

Audit ALL screens/components for text that still: (a) renders ALL-CAPS chrome, (b) calls `.toUpperCase()` on labels, (c) is a heading/title/section/button/stat-value without `FONTS.display`, or (d) uses leftover heavy `letterSpacing` (≥2).

Apply:
- Sentence-case remaining caps chrome (e.g. player **nameplate** `RAYNALD ARVAN LIM` → natural case via removing `.toUpperCase()`/uppercase styling; `% AVG`; any zone/status words; Awakening remnants; Mirror attribute labels if still caps).
- Add `FONTS.display` (Lora) to any heading/title/section-header/stat-value/primary-button style still missing it; keep body/caption/description on Inter.
- Reduce any heading/label `letterSpacing` ≥ 2 → 0.3 (titles) / 0.5 (small labels).
- Do NOT touch discipline names, quotes, lore body copy, the player's entered name value itself (only its casing/style), descriptions.

Search anchors: `grep -rnE "toUpperCase|letterSpacing: [2-9]|fontWeight: 'bold'" src` and the ALL-CAPS string scan from prior work. Files most likely still holding leftovers: `Mirror.tsx` (nameplate), `AscensionPath.tsx` (handled in Part 1), plus any missed in `LevelUpSplash`, `MandateReveal`, `ShieldOverlay`, `CommandHall`.

## Components touched / boundaries

- `src/components/avatar/ClaudeSpark.tsx` — add `glow?: boolean` (soft radial halo). `tint?` already exists. Keep existing callers working.
- `src/screens/AscensionPath.tsx` — main redesign (node renderer, connectors, zones, modal, header polish).
- Possibly a small `src/components/ui/ZoneLabel` inline (or keep inline in AscensionPath) — keep inline to avoid over-splitting.
- Misc screens/components — typography touch-ups (Part 2).

## Testing

- `npx jest` (90 pass) after each part; update any test asserting an exact uppercase string that changes (e.g. AscensionPath modal "WEEK"/"NOW" if asserted).
- On-device screenshot verification: Ascend (trail, current-week glow, a zone header, node modal), Mirror nameplate, and a spot-check of other screens.

## Out of scope / non-goals

- No change to journey math, week completion logic, node count, or store.
- No new screens. No copy rewrite beyond casing.
- Signing key unchanged.

## Risks

- `react-native-svg` mock must export any new elements the spark halo uses (already covers Path/Circle/RadialGradient/Stop/Defs).
- Warm zone tints must stay subtle — over-saturating bands looks gaudy; verify on device.
- Release APK bundles JS; rebuild with JBR 21 (per `the-system-prebuild` memory) + install to verify.
