# ropelabs.org

## Markdown-driven pages

Any `.md` file placed inside `content/` is rendered to a matching `.html` file under `docs/` using `scripts/build-pages.ts`.

1. Create or edit a Markdown file in `content/`. Use front matter to override:
   - `title`, `description`
   - `sidebarTitle`, `sidebarSummary`
   - `backLinkHref`, `backLinkLabel`
   - `slug` (output filename) or `output` (full relative path)
2. Run `bun run build:pages` to regenerate the HTML files (or `bun run dev` to rebuild automatically while you edit and preview).
3. Commit only the Markdown sources and scripts. The GitHub Pages workflow builds `docs/*.html` on main and deploys the output, so the generated files stay out of git.

GitHub Pages is driven by `.github/workflows/pages.yml`, which installs Bun, runs `bun run build:pages`, and publishes the `docs/` directory on pushes to `main`.

