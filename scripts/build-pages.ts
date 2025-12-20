import { build } from 'simple-markdown-builder'
import path from 'node:path'

const config = {
  contentDir: 'content',
  outputDir: 'docs',
  baseUrl: 'https://ropelabs.org',
  templatePath: path.resolve('scripts/template.html'),
  homepageTemplatePath: path.resolve('scripts/homepage-template.html'),
  defaultMeta: {
    title: 'RopeLabs',
    description: 'A small group of Shibari enthusiasts, providing lessons & info.',
    sidebarTitle: 'RopeLabs',
    sidebarSummary: 'A small, queer-friendly group of rope enthusiasts, building a friendly and respectful environment for exploring rope safely and openly.',
    backLinkHref: '/',
    backLinkLabel: 'Back to RopeLabs',
  },
  utmParams: {
    utm_campaign: 'ropelabs',
    utm_medium: 'website',
    utm_source: 'ropelabs',
  },
  markdownOptions: {
    html: true,
    linkify: true,
    typographer: true,
  },
}

const WATCH_FLAG = process.argv.includes('--watch')

if (WATCH_FLAG) {
  const { startDevServer } = await import('simple-markdown-builder')
  await startDevServer(config, {
    port: Number(process.env.PORT ?? 4173),
    outputDir: 'docs',
  })
} else {
  await build(config)
}
