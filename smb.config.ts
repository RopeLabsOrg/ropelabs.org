import { defineConfig } from 'simple-markdown-builder'

export default defineConfig({
  baseUrl: 'https://ropelabs.org',
  templatePath: 'scripts/template.html',
  homepageTemplatePath: 'scripts/homepage-template.html',
  robots: true,
  lastmod: 'git',
  defaultMeta: {
    title: 'RopeLabs',
    description:
      'A small group of Shibari enthusiasts, providing lessons & info.',
    sidebarTitle: 'RopeLabs',
    sidebarSummary:
      'A small, queer-friendly group of rope enthusiasts, building a friendly and respectful environment for exploring rope safely and openly.',
    backLinkHref: '/',
    backLinkLabel: 'Back to RopeLabs',
    ogImage: '/img/icon-512.png',
  },
  // Applied by the builder to every rendered external link (any host not
  // ending in ropelabs.org). `utm_campaign` is the free slot: the builder
  // skips any URL that already contains `utm_campaign=`, so an individual
  // link can be hand-tagged per page. shop.tsurineko.org reads these three
  // keys first-party into `Order` via its `CapturesAcquisition` concern.
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
})
