import {defineConfig} from '@playwright/test'

const origin = 'http://127.0.0.1:4173'

export default defineConfig({
  testDir: './tests/browser',
  use: {
    baseURL: origin,
    channel: process.env.PLAYWRIGHT_CHANNEL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {name: 'desktop', use: {viewport: {width: 1280, height: 850}}},
    {name: 'mobile-reduced-motion', use: {
      viewport: {width: 360, height: 844}, isMobile: true, hasTouch: true, reducedMotion: 'reduce',
    }},
  ],
  webServer: {
    command: 'npm run build -- --base=./ && npm run build:portable && npm exec -- vite preview --host 127.0.0.1 --port 4173 --strictPort',
    url: origin,
  },
})
