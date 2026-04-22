# RopeLabs design language

Shared visual language across the three-part rope-scene ecosystem:

- **Tsuri Neko** (`tsurineko.org`) — rope product sales
- **International Shibari Events** (`shibari-events.org`) — event discovery
- **RopeLabs** (`ropelabs.org`) — teaching *(this repo)*

ISE is the reference implementation. RopeLabs shares every anchor token with ISE / TN, and shifts only the accent.

## Two-tier linkage

| Pair | Relationship | Why |
|---|---|---|
| TN ↔ ISE | **Strongly linked** — near-identical palette | Both serve *discovery/catalog* mode. Visual seam should be invisible. |
| RopeLabs ↔ ISE | **Loosely linked** — same family, shifted accent | Teaching is a different emotional register (warmer, more approachable) than catalog. Own accent; shared anchors. |

**Shared anchors across all three:** kinari page (`#f7f3ea`), sumi-indigo ink (`#1a2332`), indigo secondary (`#2c4a6b`).

**RopeLabs distinct axis:** matcha primary (`#5f6b3a`) in place of ISE/TN's kakiiro persimmon. Green reads "growth / learning" without drifting off-family.

## Token reference — RopeLabs (matcha variant)

Japanese craft references — not fetish cliché. Sumi (墨) is calligraphy ink. Kinari (生成り) is unbleached cotton/paper. Matcha (抹茶) for the teaching accent.

```css
:root {
  --color-page: #f7f3ea;                      /* kinari — unbleached cream */
  --color-surface: rgba(255, 255, 255, 0.92);
  --color-surface-strong: #ffffff;
  --color-text: #1a2332;                      /* sumi — near-black indigo */
  --color-muted: #5a6372;                     /* WCAG AA on kinari (4.5:1+) */
  --color-border: rgba(26, 35, 50, 0.14);
  --color-primary: #5f6b3a;                   /* matcha — teaching accent */
  --color-primary-hover: #4d5730;
  --color-secondary: #2c4a6b;                 /* aizome — indigo */
  --color-highlight: #5f6b3a;
  --color-danger: #8a2a2a;
  --color-focus: #2c4a6b;
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

Contrast: body text ~15:1, muted ~5.8:1 on kinari — both pass WCAG AA.

## Notes

- `--color-primary` and `--color-success` collapse to the same matcha in this variant. That's intentional — lean on iconography / copy for success states instead of a second green.
- Alternative accent candidate if matcha feels too similar to catalog: warmer clay/terracotta (`#b07a4a`). Swatch-test before committing.
- **Don't extract a shared `@ropelabs/tokens` npm package yet.** Revisit once all three properties are on the new palette and a *third* coordinated token change is pending.

## Reference

ISE palette lands in commit `0a04cb2` on branch `Pezmc/office-hours-review` of the shibari-events.org repo. Files of interest there: `src/styles.css`, `src/components/EventCard.vue`, `src/components/DateField.vue`.
