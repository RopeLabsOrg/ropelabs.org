import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import chokidar from 'chokidar'
import MarkdownIt from 'markdown-it'
import anchor from 'markdown-it-anchor'

interface FrontMatter {
  readonly title?: string
  readonly description?: string
  readonly sidebarTitle?: string
  readonly sidebarSummary?: string
  readonly backLinkHref?: string
  readonly backLinkLabel?: string
  readonly slug?: string
  readonly output?: string
  readonly ogImage?: string
  readonly noindex?: string | boolean
}

interface RenderPlan {
  readonly sourcePath: string
  readonly outputPath: string
  readonly relativeOutput: string
  readonly html: string
  readonly meta: Required<Omit<FrontMatter, 'slug' | 'output' | 'ogImage' | 'noindex'>> &
    Pick<FrontMatter, 'slug' | 'output' | 'ogImage' | 'noindex'>
}

interface MissingLink {
  readonly fromFile: string
  readonly href: string
  readonly resolvedPath: string
}

const CONTENT_DIR = path.resolve('content')
const OUTPUT_DIR = path.resolve('docs')
const TEMPLATE_PATH = path.resolve('scripts/template.html')
const BASE_URL = 'https://ropelabs.org'
const SKIP_PREFIXES = ['#', 'mailto:', 'tel:', 'javascript:', 'data:']
const SKIP_SCHEMES = ['http://', 'https://']

const DEFAULT_META: Required<Omit<FrontMatter, 'slug' | 'output' | 'ogImage' | 'noindex'>> = {
  title: 'RopeLabs',
  description: 'A small group of Shibari enthusiasts, providing lessons & info.',
  sidebarTitle: 'RopeLabs',
  sidebarSummary: 'A small, queer-friendly group of rope enthusiasts, building a friendly and respectful environment for exploring rope safely and openly.',
  backLinkHref: '/',
  backLinkLabel: 'Back to RopeLabs',
}

const WATCH_FLAG = process.argv.includes('--watch')
let cachedTemplate: string | null = null

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
}).use(anchor, {
  level: [1, 2, 3],
  permalink: false,
  slugify: (s: string) => {
    return s
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
  },
})

async function build(): Promise<void> {
  const markdownFiles = await collectMarkdownFiles(CONTENT_DIR)

  if (markdownFiles.length === 0) {
    console.warn('No markdown files found in content/.')
    return
  }

  const plans = await Promise.all(markdownFiles.map(async (filePath) => createPlan(filePath)))

  await Promise.all(
    plans.map(async (plan) => {
      await mkdir(path.dirname(plan.outputPath), { recursive: true })
      const rendered = await buildHtml(plan.html, plan.meta)
      await writeFile(plan.outputPath, rendered)
      // eslint-disable-next-line no-console
      console.log(`Generated ${path.relative(process.cwd(), plan.outputPath)}`)
    }),
  )

  await writeSitemap(plans)
  await checkLinks()
}

async function createPlan(filePath: string): Promise<RenderPlan> {
  const sourcePath = path.resolve(filePath)
  const relativeSource = path.relative(CONTENT_DIR, sourcePath)
  const raw = await readFile(sourcePath, 'utf-8')
  const { body, meta } = extractFrontMatter(raw)
  const slug = sanitizeSlug(
    meta.slug ?? path.basename(filePath).replace(/\.md$/, ''),
  )
  const outputName = (meta.output ?? `${slug}.html`).replace(/^\/+/, '')
  const outputPath = path.join(OUTPUT_DIR, ...outputName.split('/'))
  const mergedMeta = {
    ...DEFAULT_META,
    ...meta,
    slug,
    output: outputName,
  }

  return {
    sourcePath,
    outputPath,
    relativeOutput: outputName,
    html: appendUtmParams(md.render(body)),
    meta: mergedMeta,
  }
}

function extractFrontMatter(raw: string): { readonly body: string; readonly meta: FrontMatter } {
  const FRONT_MATTER_BOUNDARY = /^---\s*$/
  const lines = raw.split(/\r?\n/)

  if (lines[0]?.match(FRONT_MATTER_BOUNDARY) !== null) {
    const endIndex = lines.findIndex((line, index) => index > 0 && line.match(FRONT_MATTER_BOUNDARY))
    if (endIndex > 0) {
      const metaLines = lines.slice(1, endIndex)
      const bodyLines = lines.slice(endIndex + 1)
      return {
        body: bodyLines.join('\n').trim(),
        meta: parseMeta(metaLines),
      }
    }
  }

  return {
    body: raw.trim(),
    meta: {},
  }
}

function parseMeta(lines: string[]): FrontMatter {
  return lines.reduce<FrontMatter>((acc, line) => {
    const [key, ...rest] = line.split(':')
    if (!key || rest.length === 0) {
      return acc
    }
    const rawValue = rest.join(':').trim()
    const keyName = key.trim() as keyof FrontMatter

    // Handle boolean fields
    if (keyName === 'noindex') {
      const normalized = rawValue.toLowerCase()
      const value =
        normalized === 'true' || normalized === 'yes' || normalized === '1'
      return {
        ...acc,
        [keyName]: value,
      }
    }

    const value = parseMetaValue(rawValue)
    return {
      ...acc,
      [keyName]: value,
    }
  }, {})
}

function parseMetaValue(raw: string): string {
  if (!raw.startsWith('"') || !raw.endsWith('"')) {
    return raw
  }

  const inner = raw.slice(1, -1)
  return inner.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
}

function sanitizeSlug(value: string): string {
  // If the slug contains slashes, preserve directory structure
  if (value.includes('/')) {
    return value
      .split('/')
      .map((segment) => sanitizeSlugSegment(segment))
      .filter((segment) => segment.length > 0)
      .join('/')
  }
  return sanitizeSlugSegment(value)
}

function sanitizeSlugSegment(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'page'
  )
}

async function buildHtml(body: string, meta: RenderPlan['meta']): Promise<string> {
  const isHomepage = meta.output === 'index.html'
  
  if (isHomepage) {
    return renderWithTemplate(buildHomepageBody(body, meta), meta)
  }
  
  return renderWithTemplate(buildDetailBody(body, meta), meta)
}

function buildHomepageBody(body: string, meta: RenderPlan['meta']): string {
  return `<div class="relative isolate overflow-hidden">
      <div class="mx-auto max-w-4xl px-6 py-16 lg:px-10">
        <div class="flex flex-col items-center text-center mb-12">
          <img src="/img/logo_acyonym_small.png" alt="RopeLabs logo" class="mb-6 h-24 w-24" />
          <h1 class="text-5xl font-bold text-brand mb-4">${meta.title}</h1>
          <p class="text-xl text-slate-600 max-w-2xl">${meta.description}</p>
        </div>
        <div class="prose prose-lg prose-slate max-w-none mx-auto prose-a:text-accent prose-strong:text-brand prose-headings:text-brand prose-headings:font-semibold">
          ${body}
        </div>
      </div>
      <footer class="border-t border-accent/10 bg-brand text-white mt-16">
        <div class="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-4 px-6 py-6 text-sm">
          <span>
            © ${new Date().getFullYear()} RopeLabs •
            <a data-email-link href="#" class="text-white underline decoration-dashed decoration-white/70 underline-offset-4 hover:decoration-white">
              <span
                data-email
                data-user="Y29udGFjdA=="
                data-domain="cm9wZWxhYnMub3Jn"
              >c&#8203;o&#8203;n&#8203;t&#8203;a&#8203;c&#8203;t&#8203;@&#8203;r&#8203;o&#8203;p&#8203;e&#8203;l&#8203;a&#8203;b&#8203;s&#8203;.&#8203;o&#8203;r&#8203;g</span>
            </a>
          </span>
        </div>
      </footer>
    </div>`
}

function buildDetailBody(body: string, meta: RenderPlan['meta']): string {
  const showBackLink = meta.output !== 'index.html'
  return `<div class="relative isolate overflow-hidden bg-white/95 backdrop-blur">
      <div class="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12 lg:flex-row lg:gap-16 lg:px-10">
        <aside class="lg:w-1/4">
          ${showBackLink ? `<a href="${meta.backLinkHref}" class="inline-flex items-center gap-2 text-brand hover:underline" aria-label="${meta.backLinkLabel}">
            <span aria-hidden="true">←</span>
            ${meta.backLinkLabel}
          </a>` : ''}
          <div class="${showBackLink ? 'mt-6' : ''} rounded-2xl border border-accent/30 bg-rope/20 p-6 text-sm shadow-sm">
            <img src="/img/logo_acyonym_small.png" alt="RopeLabs logo" class="mb-4 h-16 w-16" />
            <p class="font-semibold text-brand">${meta.sidebarTitle}</p>
            <p class="mt-2 text-slate-700">
              ${meta.sidebarSummary}
            </p>
          </div>
        </aside>
        <main class="prose prose-slate max-w-none lg:w-3/4 prose-a:text-accent prose-strong:text-brand prose-headings:text-brand">
          ${body}
        </main>
      </div>
      <footer class="border-t border-accent/10 bg-brand text-white">
        <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm">
          <span>
            © ${new Date().getFullYear()} RopeLabs •
            <a data-email-link href="#" class="text-white underline decoration-dashed decoration-white/70 underline-offset-4 hover:decoration-white">
              <span
                data-email
                data-user="Y29udGFjdA=="
                data-domain="cm9wZWxhYnMub3Jn"
              >c&#8203;o&#8203;n&#8203;t&#8203;a&#8203;c&#8203;t&#8203;@&#8203;r&#8203;o&#8203;p&#8203;e&#8203;l&#8203;a&#8203;b&#8203;s&#8203;.&#8203;o&#8203;r&#8203;g</span>
            </a>
          </span>
        </div>
      </footer>
    </div>`
}

function appendUtmParams(html: string): string {
  const UTM = 'utm_campaign=ropelabs&utm_medium=website&utm_source=ropelabs'
  return html.replace(/href="(https?:\/\/[^"]+)"/g, (fullMatch, hrefValue) => {
    const decoded = hrefValue.replace(/&amp;/g, '&')
    let host = ''
    try {
      host = new URL(decoded).hostname
    } catch {
      return fullMatch
    }

    const isInternal = host.endsWith('ropelabs.org')
    const needsUtm = !decoded.includes('utm_campaign=') && !isInternal
    const updated = needsUtm
      ? `${decoded}${decoded.includes('?') ? '&' : '?'}${UTM}`
      : decoded

    const escaped = updated.replace(/&/g, '&amp;')
    const externalAttrs = isInternal
      ? ''
      : ' target="_blank" rel="noopener noreferrer"'
    return `href="${escaped}"${externalAttrs}`
  })
}

async function renderWithTemplate(body: string, meta: RenderPlan['meta']): Promise<string> {
  const template = await loadTemplate()
  const pageUrl = cleanUrl(meta.output ?? 'index.html')
  const canonicalUrl = pageUrl
  const ogImage = meta.ogImage
    ? toAbsoluteUrl(meta.ogImage)
    : toAbsoluteUrl('img/logo_acyonym.png')
  
  return template
    .replace('{{TITLE}}', escapeHtml(meta.title))
    .replace('{{DESCRIPTION}}', escapeHtml(meta.description))
    .replace('{{CANONICAL_URL}}', canonicalUrl)
    .replace('{{OG_URL}}', pageUrl)
    .replace('{{OG_TITLE}}', escapeHtml(meta.title))
    .replace('{{OG_DESCRIPTION}}', escapeHtml(meta.description))
    .replace('{{OG_IMAGE}}', ogImage)
    .replace('{{TWITTER_TITLE}}', escapeHtml(meta.title))
    .replace('{{TWITTER_DESCRIPTION}}', escapeHtml(meta.description))
    .replace('{{TWITTER_IMAGE}}', ogImage)
    .replace('{{BODY}}', body)
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

async function loadTemplate(): Promise<string> {
  if (cachedTemplate !== null) {
    return cachedTemplate
  }
  cachedTemplate = await readFile(TEMPLATE_PATH, 'utf-8')
  return cachedTemplate
}

function isNoindexEnabled(meta: RenderPlan['meta']): boolean {
  if (meta.noindex === undefined || meta.noindex === false) {
    return false
  }
  if (typeof meta.noindex === 'boolean') {
    return meta.noindex
  }
  const normalized = meta.noindex.trim().toLowerCase()
  return ['true', 'yes', '1'].includes(normalized)
}

async function writeSitemap(plans: RenderPlan[]): Promise<void> {
  const unique = new Map<string, RenderPlan>()
  plans.forEach((plan) => unique.set(plan.relativeOutput, plan))

  const rows = [...unique.values()]
    .filter((plan) => !isNoindexEnabled(plan.meta))
    .sort((a, b) => a.relativeOutput.localeCompare(b.relativeOutput))
    .map((plan) => {
      return ['  <url>', `    <loc>${cleanUrl(plan.relativeOutput)}</loc>`, '  </url>'].join(
        '\n',
      )
    })
    .join('\n')

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rows}
</urlset>
`

  const sitemapPath = path.join(OUTPUT_DIR, 'sitemap.xml')
  await mkdir(path.dirname(sitemapPath), { recursive: true })
  await writeFile(sitemapPath, sitemap)
  // eslint-disable-next-line no-console
  console.log(`Generated ${path.relative(process.cwd(), sitemapPath)}`)
}

function toAbsoluteUrl(relativePath: string): string {
  const normalized = `/${relativePath.replace(/^\/+/, '')}`
  return new URL(normalized, BASE_URL).toString()
}

function cleanUrl(relativePath: string): string {
  // Remove .html extension
  let cleaned = relativePath.replace(/\.html$/, '')
  // Convert index to empty string (root path)
  if (cleaned === 'index') {
    cleaned = ''
  }
  // Ensure it starts with /
  const normalized = cleaned ? `/${cleaned}` : '/'
  return new URL(normalized, BASE_URL).toString()
}

async function collectMarkdownFiles(dir: string): Promise<readonly string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        return collectMarkdownFiles(fullPath)
      }
      return entry.isFile() && entry.name.endsWith('.md') ? [fullPath] : []
    }),
  )
  return files.flat()
}

async function collectHtmlFiles(dir: string): Promise<readonly string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        return collectHtmlFiles(fullPath)
      }
      return entry.isFile() && fullPath.endsWith('.html') ? [fullPath] : []
    }),
  )
  return files.flat()
}

function isSkippableHref(href: string): boolean {
  return (
    !href ||
    SKIP_PREFIXES.some((prefix) => href.startsWith(prefix)) ||
    SKIP_SCHEMES.some((scheme) => href.startsWith(scheme))
  )
}

function resolveInternalPath(href: string, fromFile: string): string {
  const withoutHash = href.split('#')[0] ?? ''
  const withoutQuery = withoutHash.split('?')[0] ?? ''
  if (withoutQuery.startsWith('/')) {
    const relativePath = withoutQuery.slice(1).replace(/\/+/g, '/')
    return path.normalize(path.join(OUTPUT_DIR, ...relativePath.split('/')))
  }
  // For relative paths that don't go up (no ../), try resolving from OUTPUT_DIR first
  // This handles cases like img/logo.png which are meant to be from site root
  if (!withoutQuery.startsWith('../') && !path.isAbsolute(withoutQuery)) {
    const rootResolved = path.normalize(path.join(OUTPUT_DIR, withoutQuery))
    return rootResolved
  }
  return path.normalize(path.resolve(path.dirname(fromFile), withoutQuery))
}

function extractHrefs(html: string): string[] {
  const matches = html.match(/href="([^"]+)"/g) ?? []
  return matches.map((match) => match.slice(6, -1))
}

async function checkLinks(): Promise<void> {
  const htmlFiles = await collectHtmlFiles(OUTPUT_DIR)
  if (htmlFiles.length === 0) {
    // eslint-disable-next-line no-console
    console.warn('No generated HTML files found in docs/. Skipping link check.')
    return
  }

  const missing: MissingLink[] = []

  for (const file of htmlFiles) {
    const content = await readFile(file, 'utf-8')
    const hrefs = extractHrefs(content)
    for (const href of hrefs) {
      if (isSkippableHref(href)) {
        continue
      }
      const resolvedPath = resolveInternalPath(href, file)

      const normalizedResolved = path.normalize(resolvedPath)
      const pathVariations = [
        normalizedResolved,
        `${normalizedResolved}.html`,
        path.join(normalizedResolved, 'index.html'),
      ]

      let found = false
      for (const variation of pathVariations) {
        try {
          const normalizedVariation = path.normalize(variation)
          const stats = await stat(normalizedVariation)
          const checkPath = stats.isDirectory()
            ? path.join(normalizedVariation, 'index.html')
            : normalizedVariation
          await stat(checkPath)
          found = true
          break
        } catch {
          // Continue to next variation
        }
      }

      if (!found) {
        missing.push({
          fromFile: file,
          href,
          resolvedPath,
        })
      }
    }
  }

  if (missing.length > 0) {
    const details = missing
      .map(
        (miss) =>
          `- ${miss.href} from ${path.relative(process.cwd(), miss.fromFile)} -> missing ${path.relative(process.cwd(), miss.resolvedPath)}`,
      )
      .join('\n')
    throw new Error(`Broken internal links found:\n${details}`)
  }

  // eslint-disable-next-line no-console
  console.log('Link check passed: all internal links resolve.')
}

async function startWatch(): Promise<void> {
  await build()
  const watcher = chokidar.watch(path.join(CONTENT_DIR, '**/*.md'), {
    ignoreInitial: true,
  })
  let isBuilding = false
  let shouldRebuild = false

  const queueBuild = (): void => {
    if (isBuilding) {
      shouldRebuild = true
      return
    }
    isBuilding = true
    build()
      .catch((error) => {
        console.error(error)
      })
      .finally(() => {
        isBuilding = false
        if (shouldRebuild) {
          shouldRebuild = false
          queueBuild()
        }
      })
  }

  watcher.on('add', queueBuild).on('change', queueBuild).on('unlink', queueBuild)
  // eslint-disable-next-line no-console
  console.log('Watching content/ for Markdown changes...')
}

if (WATCH_FLAG) {
  startWatch().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
} else {
  build().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}

