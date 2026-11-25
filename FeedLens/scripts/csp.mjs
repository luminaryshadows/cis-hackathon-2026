import {createHash} from 'node:crypto'

// FeedLens loads no third-party resources: the bundle, fonts and photos are all
// served from the site itself (or inlined in the portable build). These policies
// are the single source of truth for the built site and the standalone file, so a
// regression cannot silently drop the header from one of them.
const shared = [
  "default-src 'none'",
  "connect-src 'none'",
  "object-src 'none'",
  "frame-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
]

// The Vite build emits the import worker as an inline blob (falling back to a
// data: URL), and React writes element style attributes, so those sources stay
// open while scripts stay same-origin only.
export const PRODUCTION_POLICY = [
  ...shared,
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "worker-src 'self' blob: data:",
].join('; ')

/** @param {string} text */
export function sha256(text) {
  return `sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}`
}

/**
 * The portable build has no origin (it is opened from file://), so every inline
 * block is allowed by hash instead of by origin.
 * @param {readonly string[]} inlineScripts
 */
export function portablePolicy(inlineScripts) {
  if (!inlineScripts.length) throw new Error('portablePolicy needs at least one inline script')
  const hashes = inlineScripts.map(text => `'${sha256(text)}'`).join(' ')
  return [
    ...shared,
    `script-src ${hashes}`,
    "style-src 'unsafe-inline'",
    'img-src data:',
    'font-src data:',
    'worker-src blob: data:',
  ].join('; ')
}

/**
 * Put the policy ahead of every subresource in <head>.
 * @param {string} html
 * @param {string} [policy]
 */
export function applySecurityMeta(html, policy = PRODUCTION_POLICY) {
  if (/http-equiv=["']?content-security-policy/i.test(html)) {
    throw new Error('The document already declares a Content-Security-Policy')
  }
  const head = /<head[^>]*>/i.exec(html)
  if (!head) throw new Error('The document has no <head> to hold the security policy')
  const at = head.index + head[0].length
  const meta = `<meta http-equiv="Content-Security-Policy" content="${policy}">`
  return html.slice(0, at) + meta + html.slice(at)
}
