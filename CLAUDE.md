# ropelabs.org

RopeLabs teaching property, international audience. Workshop and class
information. Bun + `simple-markdown-builder` + GitHub Pages.

Part of the Tsuri Neko / RopeLabs ecosystem — see `../` umbrella repo and
`../docs/ecosystem.md` for cross-site context and the strong/loose visual-link
model. Note: `ropelabs.be` is a separate, standalone Belgian presence with
non-shibari wellness/movement content; do **not** propagate shibari, kink,
or rope-bondage copy, imagery, or routing into `.be`.

## Stack

- Bun runtime + TypeScript
- `simple-markdown-builder` v1.0.1 renders `content/*.md` → `docs/` via
  `scripts/build-pages.ts`
- HTML templates with inline Tailwind config + `:root` CSS variables in
  `scripts/template.html`
- Deploy: GitHub Pages on push to `main`
- Prettier via `bun run format`
- `.claude/hooks/` — pre-tool gstack-check hook

Scripts: `bun run dev` (watch), `bun run build:pages`, `bun run build:clean`,
`bun run format`.

## Content layout

- `content/index.md` — homepage
- `content/donate.md`, `content/why2025.md`,
  `content/rope-and-safety-kit.md` — core pages
- `content/39c3/` — event-specific subfolder

## Design language

Canonical tokens live in `../DESIGN.md` (umbrella). This repo's local
`DESIGN.md` mirrors it with a dated sync note.

- Accent: **matcha `#5f6b3a`** — warmer, more approachable teaching register.
  Shares anchors (kinari page, sumi ink, aizome links) with the
  `tsurineko.org` family; the accent is the distinct axis.
- Matcha is already wired into `scripts/template.html` as `--color-primary`.

## Voice rules

Dry, concrete, Belgian/British understatement. "Workshop runs two days. You
bring rope, we bring a lesson plan." No emoji, no exclamation marks, no
testimonials, no hero carousels.

## Ecosystem rules

- This is the **international teaching** surface. Kink/shibari framing is
  welcome.
- Cross-links to `tsurineko.org` and `shibari-events.tsurineko.org` are fine.
  Do **not** cross-link to or import content from `ropelabs.be` — treat it as
  an unrelated brand that happens to share tooling and the matcha family.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill
tool. Skills have multi-step workflows, checklists, and quality gates that
produce better results than an ad-hoc answer. When in doubt, invoke the
skill. A false positive is cheaper than a false negative.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke /office-hours
- Strategy, scope, "think bigger", "what should we build" → invoke /plan-ceo-review
- Architecture, "does this design make sense" → invoke /plan-eng-review
- Design system, brand, "how should this look" → invoke /design-consultation
- Design review of a plan → invoke /plan-design-review
- Developer experience of a plan → invoke /plan-devex-review
- "Review everything", full review pipeline → invoke /autoplan
- Bugs, errors, "why is this broken", "wtf", "this doesn't work" → invoke /investigate
- Test the site, find bugs, "does this work" → invoke /qa (or /qa-only for report only)
- Code review, check the diff, "look at my changes" → invoke /review
- Visual polish, design audit, "this looks off" → invoke /design-review
- Developer experience audit, try onboarding → invoke /devex-review
- Ship, deploy, create a PR, "send it" → invoke /ship
- Merge + deploy + verify → invoke /land-and-deploy
- Configure deployment → invoke /setup-deploy
- Post-deploy monitoring → invoke /canary
- Update docs after shipping → invoke /document-release
- Weekly retro, "how'd we do" → invoke /retro
- Second opinion, codex review → invoke /codex
- Safety mode, careful mode, lock it down → invoke /careful or /guard
- Restrict edits to a directory → invoke /freeze or /unfreeze
- Upgrade gstack → invoke /gstack-upgrade
- Save progress, "save my work" → invoke /context-save
- Resume, restore, "where was I" → invoke /context-restore
- Security audit, OWASP, "is this secure" → invoke /cso
- Make a PDF, document, publication → invoke /make-pdf
- Launch real browser for QA → invoke /open-gstack-browser
- Import cookies for authenticated testing → invoke /setup-browser-cookies
- Performance regression, page speed, benchmarks → invoke /benchmark
- Review what gstack has learned → invoke /learn
- Tune question sensitivity → invoke /plan-tune
- Code quality dashboard → invoke /health

## gstack (required)

This project uses [gstack](https://github.com/garrytan/gstack) for AI-assisted
workflows. A pre-tool hook in `.claude/hooks/check-gstack.sh` verifies it's
installed before work starts. If the hook reports missing:

```bash
git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup --team
```

Use /browse for all web browsing. Use ~/.claude/skills/gstack/... for gstack
file paths.
