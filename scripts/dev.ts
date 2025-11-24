import path from 'node:path'

const DOCS_DIR = path.resolve('docs')
const PORT = Number(process.env.PORT ?? 4173)

const builder = Bun.spawn({
  cmd: ['bun', 'scripts/build-pages.ts', '--watch'],
  stdout: 'inherit',
  stderr: 'inherit',
})

builder.exited.then((code) => {
  if (code !== 0) {
    console.error(`Markdown builder exited with code ${code}`)
  }
})

const server = Bun.serve({
  port: PORT,
  fetch: async (request) => {
    const url = new URL(request.url)
    let pathname = decodeURIComponent(url.pathname)

    if (pathname === '/' || pathname === '') {
      pathname = '/index.html'
    } else if (pathname.endsWith('/')) {
      pathname += 'index.html'
    }

    const primaryPath = resolveFilePath(pathname)
    const file = Bun.file(primaryPath)
    if (await file.exists()) {
      return new Response(file)
    }

    // Try folder/index.html fallback when the request had no extension
    if (!path.extname(pathname)) {
      const fallbackPath = resolveFilePath(path.join(pathname, 'index.html'))
      const fallbackFile = Bun.file(fallbackPath)
      if (await fallbackFile.exists()) {
        return new Response(fallbackFile)
      }
    }

    return new Response('Not found', { status: 404 })
  },
})

console.log(`Serving docs from ${DOCS_DIR} at http://localhost:${PORT}`)

function resolveFilePath(requestPath: string): string {
  const normalized = path
    .normalize(requestPath)
    .replace(/^(\.\.(\/|\\|$))+/, '')
    .replace(/^\/+/, '')
  return path.join(DOCS_DIR, normalized)
}

function shutdown(): void {
  server.stop()
  builder.kill()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

