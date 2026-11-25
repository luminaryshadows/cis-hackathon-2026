import {expect, test} from '@playwright/test'
import type {Page} from '@playwright/test'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

type Report = {violations: string[]; errors: string[]}

// A blocked directive is reported to the console, so watching it proves the policy
// still lets the real app load its bundle, images, fonts and import worker.
function watch(page: Page): Report {
  const report: Report = {violations: [], errors: []}
  page.on('console', message => {
    if (/content security policy|refused to (load|execute|create|connect)/i.test(message.text())) {
      report.violations.push(message.text())
    }
  })
  page.on('pageerror', error => report.errors.push(error.message))
  return report
}

async function policyOf(page: Page) {
  const policy = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content')
  expect(policy, 'the document must declare a Content-Security-Policy').toBeTruthy()
  return Object.fromEntries(policy!.split(';').map(part => part.trim().split(/\s+/))
    .map(([name, ...values]) => [name, values]))
}

async function exercise(page: Page, entry = '') {
  await page.getByRole('button', {name: 'Dislike', exact: true}).click()
  await expect(page.getByRole('button', {name: 'Disliked', exact: true, pressed: true})).toBeVisible()
  const cover = page.locator('.player img.poster').first()
  expect(await cover.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  await page.goto(entry + '#instagram')
  await page.getByRole('button', {name: 'Try example data'}).click()
  await expect(page.getByRole('region', {name: 'Example activity'})).toBeVisible()
  expect(await page.evaluate(() => document.fonts.status)).toBe('loaded')
}

test('the built site serves a strict policy that still allows its own assets', async ({page}) => {
  const report = watch(page)
  await page.goto('/#feed')
  const directives = await policyOf(page)
  expect(directives['default-src']).toEqual(["'none'"])
  expect(directives['script-src']).toEqual(["'self'"])
  expect(directives['object-src']).toEqual(["'none'"])
  expect(directives['base-uri']).toEqual(["'none'"])
  expect(directives['form-action']).toEqual(["'none'"])
  expect(directives['connect-src']).toEqual(["'none'"])
  await exercise(page, '/')
  expect(report.violations).toEqual([])
  expect(report.errors).toEqual([])
})

test('the standalone file authorises only its hashed inline blocks', async ({page}) => {
  const report = watch(page)
  const entry = pathToFileURL(resolve('..', 'FeedLens.html')).href
  await page.goto(entry + '#feed')
  const directives = await policyOf(page)
  expect(directives['default-src']).toEqual(["'none'"])
  expect(directives['script-src']).toHaveLength(2)
  for (const source of directives['script-src']) expect(source).toMatch(/^'sha256-[A-Za-z0-9+/=]+'$/)
  await exercise(page, entry)
  expect(report.violations).toEqual([])
  expect(report.errors).toEqual([])
})
