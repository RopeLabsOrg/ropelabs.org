# ropelabs.org

## Markdown-driven pages

Any `.md` file placed inside `content/` is rendered to a matching `.html` file under `docs/` using [simple-markdown-builder](https://www.npmjs.com/package/simple-markdown-builder).

## Local Development

1. Install dependencies:
   ```bash
   bun install
   ```

2. Start the development server (with auto-rebuild and live preview):
   ```bash
   bun run dev
   ```
   The dev server runs on `http://localhost:4173` by default (or set `PORT` environment variable).

3. Build static pages for production:
   ```bash
   bun run build:pages
   ```

## Creating Pages

1. Create or edit a Markdown file in `content/`. Use front matter to override:
   - `title`, `description`
   - `sidebarTitle`, `sidebarSummary`
   - `backLinkHref`, `backLinkLabel`
   - `slug` (output filename) or `output` (full relative path)

2. The HTML files are generated automatically in the `docs/` directory.

3. Commit only the Markdown sources and scripts. The generated HTML files in `docs/` are built on deployment.

## Further Documentation

For detailed documentation on configuration options, template placeholders, and advanced features, see the [simple-markdown-builder package documentation](https://www.npmjs.com/package/simple-markdown-builder).
