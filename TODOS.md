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

### Decide the outbound UTM posture

**What:** `scripts/build-pages.ts` appends
`?utm_campaign=ropelabs&utm_medium=website&utm_source=ropelabs` to every external
link, while the same links carry `rel="noopener noreferrer"`.

**Why:** `noreferrer` suppresses the Referer header, then the UTM string
re-declares ropelabs.org as the origin inside the URL. Third-party analytics get
an explicit marker for shibari-workshop click-throughs that the `rel` attribute
was withholding. Either the tagging or the `rel` is doing the wrong thing.

**Context:** Site-wide and pre-existing. Surfaced because the 2026 events PR
pointed it at three new third-party destinations (emfcamp.org, bornhack.dk,
content.fri3d.be). This is a posture call, not a bug: keep the attribution and
drop the pretence, or drop the UTM params on outbound links.

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
