# ropelabs.org — Design System (local mirror)

Synced from `../DESIGN.md` (rope-sites umbrella) on 2026-04-22.

If tokens need to change, edit the umbrella `../DESIGN.md` first, then re-sync
here and update the sync date above. See `../docs/ecosystem-palette.md` for
why copy-paste beats a shared package at this stage.

---

Shared across the rope-sites design system. The full site list and the
reference implementation live in the umbrella repo — see `../DESIGN.md`.

**Palette philosophy:** Japanese craft references — not fetish cliché. Sumi
(墨) is calligraphy ink. Kinari (生成り) is unbleached cotton/paper. Matcha
(抹茶) for the teaching accent.

## Two visual families

| Family | Accent |
|---|---|
| Tsuri Neko | kakiiro `#c2562a` |
| **RopeLabs (this repo)** | **matcha `#5f6b3a`** |

RopeLabs shares anchors (page, ink, link) with the other family and shifts
only the accent. Matcha reads "growth / learning" without drifting
off-family. Per-site assignments live in the umbrella repo.

## Tokens (matcha variant)

```css
:root {
  --color-page: #f7f3ea;                       /* kinari — unbleached cream */
  --color-surface: rgba(255, 255, 255, 0.92);
  --color-surface-strong: #ffffff;
  --color-text: #1a2332;                       /* sumi — near-black indigo */
  --color-muted: #5a6372;                      /* WCAG AA on kinari (4.5:1+) */
  --color-border: rgba(26, 35, 50, 0.14);
  --color-primary: #5f6b3a;                    /* matcha — teaching accent */
  --color-primary-hover: #4d5730;
  --color-secondary: #2c4a6b;                  /* aizome — indigo (links) */
  --color-highlight: #5f6b3a;
  --color-danger:  #8a2a2a;
  --color-focus:   #2c4a6b;
}

body {
  background: radial-gradient(circle at top, #fbf8f0 0%, var(--color-page) 60%);
  color: var(--color-text);
}

a { color: var(--color-secondary); }
a:hover { color: var(--color-primary); }

:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```

**Contrast verified:** body text ~15:1, muted ~5.8:1. Both pass WCAG AA.

**PR rule:** no raw hex in templates. Every new color references a token.

**Note on success states:** `--color-primary` and `--color-success` would
collapse to the same matcha here, so `--color-success` is dropped — lean on
iconography or copy for success states instead of a second green.

## Surfaces

- **Card:** `bg: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  backdrop-filter: blur(6px); padding: 2rem;`
- **Card (photography):** use `--color-surface-strong: #ffffff` when a
  photo's contrast is at risk against kinari.
- **Button:** `border-radius: 14px; padding: 0.75rem 1rem;` hover lifts
  `translateY(-1px)`. Respect `prefers-reduced-motion`.

## Typography

- **Family:** `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`
- **Scale:** h1 2rem, h2 1.5rem, h3 1.15rem, body 1rem, small 0.75rem
- **Leading:** 1.6

## Spacing & layout

- 8px grid
- `--max-content-width: 720px` for text-heavy pages
- `--max-grid-width: 1040px` for listings
- Between-card rhythm: `space-y-8` mobile, `space-y-12` desktop

## Voice rules

**Do:**
- Dry, concrete, Belgian/British understatement
- Specific: "Workshop runs two days. You bring rope, we bring a lesson plan."

**Don't:**
- Emoji, exclamation marks, chatbot-tone
- Testimonial widgets, rating stars
- Hero carousels
- AI-default combos (`bg-white shadow-md rounded-lg text-gray-900`)

## Iconography

- **Library:** Heroicons outline
- **Color:** `var(--color-text)` by default; `var(--color-primary)` on CTAs
- Do not mix icon families

## Accessibility baseline

- Tap targets ≥ 44×44px
- Focus ring via `--color-focus`, visible on all interactive elements
- `prefers-reduced-motion: reduce` disables hover lifts and transitions
- `prefers-reduced-transparency: reduce` swaps `--color-surface` to
  `--color-surface-strong`
- Alt text describes the thing, not "photo of thing"

## This site's accent

| Site | Primary | Register |
|---|---|---|
| **ropelabs.org (this repo)** | **matcha `#5f6b3a`** | **Teaching (international)** |

Accents for the other sites, and the full strong/loose-link model, live in
the umbrella repo — see `../DESIGN.md` and `../docs/ecosystem.md`.
