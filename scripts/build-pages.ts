import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import chokidar from 'chokidar'
import MarkdownIt from 'markdown-it'

interface FrontMatter {
  readonly title?: string
  readonly description?: string
  readonly sidebarTitle?: string
  readonly sidebarSummary?: string
  readonly backLinkHref?: string
  readonly backLinkLabel?: string
  readonly slug?: string
  readonly output?: string
}

interface RenderPlan {
  readonly sourcePath: string
  readonly outputPath: string
  readonly relativeOutput: string
  readonly html: string
  readonly meta: Required<Omit<FrontMatter, 'slug' | 'output'>> &
    Pick<FrontMatter, 'slug' | 'output'>
}

const CONTENT_DIR = path.resolve('content')
const OUTPUT_DIR = path.resolve('docs')
const TEMPLATE_PATH = path.resolve('scripts/template.html')
const BASE_URL = 'https://ropelabs.org'

const DEFAULT_META: Required<Omit<FrontMatter, 'slug' | 'output'>> = {
  title: 'RopeLabs',
  description: 'A small group of Shibari enthusiasts, providing lessons & info.',
  sidebarTitle: 'RopeLabs',
  sidebarSummary: 'A small, queer-friendly group of rope enthusiasts, building a friendly and respectful environment for exploring rope safely and openly.',
  backLinkHref: 'index.html',
  backLinkLabel: 'Back to RopeLabs',
}

const WATCH_FLAG = process.argv.includes('--watch')
let cachedTemplate: string | null = null

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})

async function build(): Promise<void> {
  const entries = await readdir(CONTENT_DIR, { withFileTypes: true })
  const markdownFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.md'))

  if (markdownFiles.length === 0) {
    console.warn('No markdown files found in content/.')
    return
  }

  const plans = await Promise.all(markdownFiles.map(async (file) => createPlan(file.name)))

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
}

async function createPlan(fileName: string): Promise<RenderPlan> {
  const sourcePath = path.join(CONTENT_DIR, fileName)
  const raw = await readFile(sourcePath, 'utf-8')
  const { body, meta } = extractFrontMatter(raw)
  const slug = sanitizeSlug(meta.slug ?? fileName.replace(/\.md$/, ''))
  const outputName = (meta.output ?? `${slug}.html`).replace(/^\/+/, '')
  const outputPath = path.join(OUTPUT_DIR, outputName)
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
    const value = rest.join(':').trim()
    return {
      ...acc,
      [key.trim() as keyof FrontMatter]: value,
    }
  }, {})
}

function sanitizeSlug(value: string): string {
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
          <img src="img/logo_acyonym_small.png" alt="RopeLabs logo" class="mb-6 h-24 w-24" />
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
            <img src="img/logo_acyonym_small.png" alt="RopeLabs logo" class="mb-4 h-16 w-16" />
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
    if (decoded.includes('utm_campaign=')) {
      return fullMatch
    }

    let host = ''
    try {
      host = new URL(decoded).hostname
    } catch {
      return fullMatch
    }

    if (host.endsWith('ropelabs.org')) {
      return fullMatch
    }

    const separator = decoded.includes('?') ? '&' : '?'
    const updated = `${decoded}${separator}${UTM}`
    const escaped = updated.replace(/&/g, '&amp;')
    return `href="${escaped}"`
  })
}

async function renderWithTemplate(body: string, meta: RenderPlan['meta']): Promise<string> {
  const template = await loadTemplate()
  return template
    .replace('{{TITLE}}', meta.title)
    .replace('{{DESCRIPTION}}', meta.description)
    .replace('{{BODY}}', body)
}

async function loadTemplate(): Promise<string> {
  if (cachedTemplate !== null) {
    return cachedTemplate
  }
  cachedTemplate = await readFile(TEMPLATE_PATH, 'utf-8')
  return cachedTemplate
}

async function writeSitemap(plans: RenderPlan[]): Promise<void> {
  const unique = new Map<string, RenderPlan>()
  plans.forEach((plan) => unique.set(plan.relativeOutput, plan))

  const rows = [...unique.values()]
    .sort((a, b) => a.relativeOutput.localeCompare(b.relativeOutput))
    .map((plan) => {
      return ['  <url>', `    <loc>${toAbsoluteUrl(plan.relativeOutput)}</loc>`, '  </url>'].join(
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

