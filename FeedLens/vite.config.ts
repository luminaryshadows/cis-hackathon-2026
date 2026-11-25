import {defineConfig} from 'vite'
import {applySecurityMeta} from './scripts/csp.mjs'

export default defineConfig({
  plugins: [{
    // The dev server needs its own websocket and module graph, so the policy is
    // only attached to build output, which is what GitHub Pages serves.
    name: 'feedlens-security-meta',
    apply: 'build',
    transformIndexHtml: {
      order: 'pre',
      handler: (html: string) => applySecurityMeta(html),
    },
  }],
})
