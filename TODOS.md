# TODOS

## Infrastructure

### Run the link check before merge, not after

**What:** Add a `pull_request`-triggered GitHub Actions job that runs `bun run test`.

**Why:** `bun run test` renders every page and fails on any relative internal
link that does not resolve, but nothing runs it on a pull request.
`.github/workflows/pages.yml` triggers only on push to `main` or manual
dispatch, and its `build:pages` step runs the same check after the merge rather
than before it. A PR with a broken internal link merges green,
the `build` job then throws, `deploy` (which `needs: build`) never runs, and
GitHub Pages keeps serving the previous build. The change reads as merged and
the live site silently never updates.

**Context:** Found by both adversarial passes during the /ship of
`claude/previous-events-2026`. The job is small: checkout, `oven-sh/setup-bun`,
`bun install --frozen-lockfile`, `bun run test`. `shop.tsurineko.org`'s
`.github/workflows/ci.yml` is the ecosystem reference for the shape, and the
umbrella CLAUDE.md already documents "CI green gates deploy" as canonical.

**Effort:** S
**Priority:** P2
**Depends on:** None

### Fix the dead lockfile path filter in pages.yml

**What:** `.github/workflows/pages.yml` line 12 filters on `bun.lockb`; the repo
tracks `bun.lock`.

**Why:** Bun switched to the text `bun.lock` format. The filter never matches, so
a dependency bump touching only the lockfile will not trigger a deploy.

**Context:** One-word change. Flagged by the structured review and the Claude
adversarial pass during the same /ship. Left unfixed because this repo is
shared and the filter is not what that branch was changing.

**Effort:** S
**Priority:** P3
**Depends on:** None

### Trailing-slash paths pass the link check and 404 in production

**What:** `https://ropelabs.org/39c3` returns 200; `https://ropelabs.org/39c3/`
returns 404. The build's link checker accepts both.

**Why:** `content/39c3.md` and `content/39c3/` both exist, producing
`docs/39c3.html` and a `docs/39c3/` directory with no `index.html`. The checker
stats `docs/39c3`, finds a directory, fails on `docs/39c3/index.html`, then falls
through to `docs/39c3.html` and reports the link as found. A link written with a
trailing slash ships a 404 that CI cannot detect.

**Context:** Library-level, in `simple-markdown-builder`'s `findTargetFile`.
Current links use the correct no-slash form, so nothing is broken today.

**Effort:** M
**Priority:** P3
**Depends on:** None

## Completed

### Publish and adopt simple-markdown-builder 2.1.0 (2026-11-25)

Done. 2.1.0 is on npm as `latest`, and this repo is on `^2.1.0` with
`bun.lock` pinning `2.1.0`.

Both library fixes are live in the rendered output, verified rather than
assumed. Diffed the whole `docs/` tree against the 1.0.1 build: the only change
is 178 external links moving from `rel="noopener noreferrer"` to
`rel="noopener"`, with heading ids byte-identical. The two `map.why2025.org`
links now carry their params before the `#` with coordinates intact, and
`build-pages.ts` sets no `noreferrer` option, so the new default stands.

**The lockfile step was the trap.** `package.json` pinning `^2.1.0` is not
enough on its own: `.github/workflows/pages.yml` line 34 runs `bun install
--frozen-lockfile`, which installs exactly what `bun.lock` resolves and never
re-resolves the range. A published 2.1.0 with a lockfile still pinning 2.0.0
would be ignored on every deploy while reading as done. Caught by `/codex
review` as a P2 after this session had claimed the opposite. Any future bump
here or in a sibling repo has to commit the lockfile.

### Decide the outbound UTM posture (2026-11-25)

**Decided: keep the tagging, drop `noreferrer`.** External links stay tagged.
`shop.tsurineko.org` reads `utm_source`/`utm_medium`/`utm_campaign` onto
`Order` via `CapturesAcquisition`, and no analytics JS runs anywhere in the
shop -- that concern is the whole pipeline. Dropping the params would make
RopeLabs-driven orders indistinguishable from direct traffic.

What the original item got backwards: it read the UTM-vs-`noreferrer` tension
as "either the tagging or the `rel` is doing the wrong thing". It is the `rel`.
The UTM string already discloses the origin more durably than a Referer header
would, so `noreferrer` withholds nothing from the destinations that read UTMs
while hiding us from the studios that only read referrers. The value was
hardcoded in `appendUtmParams`, so it took the library change recorded above.

**Values left alone.** `utm_source=ropelabs`, `utm_medium=website`,
`utm_campaign=ropelabs` all stay. A swap to `ropelabs.org`/`referral` was
tried and reverted: the two arguments for it did not survive checking. Nothing
in the ecosystem runs GA4, so its channel-grouping rules are irrelevant, and
the bare brand value turned out never to have been ambiguous in practice --
no sibling site sharing it links to any destination this site links to. What
remained was cosmetic, against two real costs -- it would split the shop's
`orders` history at the deploy boundary, and it would break from
`tsurineko.org`'s bare `tsurineko`, which is the house convention.

`utm_campaign` duplicating `utm_source` is deliberate and documented in
`build-pages.ts`: it is the free slot, and the builder skips any URL already
carrying `utm_campaign=`, so individual links can be hand-tagged per page if
per-page attribution is ever wanted. Audited coverage at the time: 178
external links, 83 distinct destinations, 100% tagged.

### Upgrade to simple-markdown-builder 2.x (2026-11-25)

Moved from `^1.0.1` to `^2.0.0`. 2.0.0's breaking change folds accents in slugs
and heading anchors (`le-ons` -> `lecons`) and fails the build when two pages
fold to the same output. Verified safe here by diffing the full rendered `docs/`
tree before and after: **zero bytes changed**, no filenames and no heading ids.
This site has no accented filenames or headings -- the emoji in headings fold
identically in both versions -- and no `translations` config, so the
`translationOf` migration note does not apply. The seven hand-written
`#anchor` links still resolve.
