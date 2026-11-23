import {test, expect} from '@playwright/test'
import type {Locator} from '@playwright/test'
import {rank, replay} from '../../src/engine.ts'
import type {Ranked} from '../../src/engine.ts'
import {fresh, update} from '../../src/session.ts'

const start = fresh()
const liked = update(start, {type: 'like'})
const ranking = (s: typeof start) => rank(replay(s.events, s.settings), s.seen, s.settings)
const before = ranking(start)
const after = ranking(liked)

async function expectRanking(panel: Locator, expected: Ranked[]) {
  const rows = panel.getByRole('listitem')
  await expect(rows).toHaveCount(2)
  for (const [index, candidate] of expected.slice(0, 2).entries()) {
    await expect(rows.nth(index)).toContainText(candidate.post.title)
    await expect(rows.nth(index)).toContainText(candidate.total.toFixed(2))
  }
}

test('replay a Like, inspect its winner, and remove it in a separate timeline', async ({page, baseURL}, testInfo) => {
  const problems: string[] = []
  page.on('pageerror', e => problems.push(e.message))
  page.on('console', e => { if (e.type() === 'error') problems.push(e.text()) })
  page.on('request', r => {
    if (/^https?:/.test(r.url()) && new URL(r.url()).origin !== new URL(baseURL!).origin) {
      problems.push('Unexpected external request: ' + r.url())
    }
  })
  await page.goto('/#feed')
  const panel = page.getByRole('region', {name: 'Ranking replay'})
  const previous = panel.getByRole('button', {name: 'Before', exact: true})
  const current = panel.getByRole('button', {name: 'After', exact: true})
  await expect(previous).toBeDisabled()
  await expectRanking(panel, before)
  await page.getByRole('button', {name: 'Like', exact: true}).press('Enter')
  await expectRanking(panel, after)
  await previous.press('Enter')
  await expect(previous).toHaveAttribute('aria-pressed', 'true')
  await expectRanking(panel, before)
  await current.press('Space')
  await expect(current).toHaveAttribute('aria-pressed', 'true')
  await expectRanking(panel, after)
  const row = panel.getByRole('listitem').first()
  if (testInfo.project.use.reducedMotion === 'reduce') {
    await expect(row).toHaveCSS('animation-name', 'none')
    expect(await panel.evaluate(el => el.getAnimations({subtree: true}).length)).toBe(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360)
  } else {
    await expect(row).not.toHaveCSS('animation-name', 'none')
  }

  await panel.getByRole('button', {name: 'Why this winner?'}).press('Enter')
  await expect(page.getByRole('heading', {name: 'Behind the Feed'})).toBeVisible()
  await expect(page.getByRole('heading', {name: after[0].post.title})).toBeVisible()
  await expect(page.getByText('Live score', {exact: true}).locator('..')).toContainText(after[0].total.toFixed(2))
  const inspector = page.getByRole('button', {name: new RegExp(after[0].post.title), pressed: true})
  await expect(inspector).toBeVisible()

  await page.getByRole('link', {name: 'Time Machine'}).press('Enter')
  await page.getByRole('combobox', {name: 'Alternate action'}).selectOption('remove')
  await page.getByRole('button', {name: 'Save alternate branch'}).press('Enter')
  const branch = page.getByRole('region', {name: 'Branch 1 comparison'})
  await expect(branch.getByRole('row', {name: 'Gaming 4 0', exact: true})).toBeVisible()
  await expect(branch.getByRole('row', {name: 'Tech 1 0', exact: true})).toBeVisible()
  const restored = branch.getByRole('row').filter({has: page.getByRole('rowheader', {name: before[0].post.title})})
  const priorRank = after.findIndex(row => row.post.id === before[0].post.id) + 1
  await expect(restored.getByRole('cell').first()).toHaveText(priorRank + ' → 1')

  await page.getByRole('link', {name: 'Your Feed'}).press('Enter')
  await expect(page.getByRole('button', {name: 'Liked', exact: true, pressed: true})).toBeVisible()
  await expectRanking(panel, after)
  await page.getByRole('button', {name: /^Reset/}).press('Enter')
  await expectRanking(panel, before)
  await expect(previous).toBeDisabled()
  expect(problems).toEqual([])
})

test('watching and disliking the same post shows the net learned interest', async ({page}) => {
  await page.clock.install()
  await page.goto('/#feed')
  await page.getByRole('button', {name: 'Watch', exact: true}).click()
  await expect(page.getByRole('button', {name: 'Pause', exact: true})).toBeVisible()
  await page.clock.runFor(12_000)
  await expect(page.getByRole('button', {name: 'Watched', exact: true})).toBeDisabled()
  await page.getByRole('button', {name: 'Dislike', exact: true}).click()
  const balance = page.getByRole('group', {name: 'Watch time versus dislike'})
  await expect(balance).toContainText('Watch time outweighs your dislike.')
  await expect(balance).toContainText('Gaming +0.2')
  await page.getByRole('button', {name: 'Disliked', exact: true}).click()
  await expect(balance).toHaveCount(0)
})
