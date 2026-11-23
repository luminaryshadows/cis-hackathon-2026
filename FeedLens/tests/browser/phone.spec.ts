import {test, expect} from '@playwright/test'
import {rank, replay} from '../../src/engine.ts'
import {phoneSession} from '../../src/phoneSession.ts'

test('scrub the watch signal, then explore the same visit in the feed', async ({page}, testInfo) => {
  await page.goto('/')
  await expect(page.getByRole('heading', {level: 1, name: 'Inside your feed.'})).toBeVisible()
  const seconds = page.getByRole('slider', {name: 'Watch time', exact: true})
  const interest = page.getByLabel('Gaming interest', {exact: true})
  const next = page.getByRole('group', {name: 'Next recommendation'})
  await page.getByRole('button', {name: 'Watch all 12 s'}).click()
  await expect(seconds).toHaveValue('12')
  await page.getByRole('button', {name: 'Rewind'}).click()
  await expect(seconds).toHaveValue('0')
  await expect(seconds).toHaveAttribute('min', '0')
  await expect(seconds).toHaveAttribute('max', '12')

  for (const [key, position] of [['Home', 0], ['End', 12], ['ArrowLeft', 11], ['ArrowRight', 12]] as const) {
    await seconds.press(key)
    await expect(seconds).toBeFocused()
    await expect(seconds).toHaveValue(String(position))
    const session = phoneSession(position)
    const profile = replay(session.events, session.settings)
    const [winner] = rank(profile, session.seen, session.settings)
    const signed = (profile.Gaming > 0 ? '+' : '') + profile.Gaming.toFixed(2)
    const displayed = await interest.innerText()
    expect(displayed.replace('−', '-')).toContain(signed)
    await expect(next).toContainText(winner.post.title)
    await expect(next).toContainText(winner.total.toFixed(2))
  }
  if (testInfo.project.use.reducedMotion === 'reduce') {
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360)
    expect(await next.evaluate(el => el.getAnimations({subtree: true}).length)).toBe(0)
  }

  await page.getByRole('button', {name: 'Explore feed'}).press('Enter')
  await expect(page).toHaveURL(/#feed$/)
  await expect(page.getByRole('button', {name: 'Disliked', exact: true, pressed: true})).toBeVisible()
  await expect(page.getByRole('group', {name: 'Watch time versus dislike'})).toContainText('Gaming +0.2')
  await page.getByRole('link', {name: 'Time Machine'}).press('Enter')
  await expect(page.getByRole('button', {name: /Watched 12s .*Pocket-sized nostalgia/})).toBeVisible()
  await expect(page.getByRole('button', {name: /Disliked .*Pocket-sized nostalgia/})).toBeVisible()
  await page.getByRole('link', {name: 'Back to phone experiment'}).press('Enter')
  await expect(seconds).toHaveValue('12')
  await expect(seconds).toBeVisible()
})

test('the phone turntable follows the slider and respects reduced motion', async ({page}, testInfo) => {
  const start = new Date('2026-01-01T12:00:00Z')
  await page.clock.install({time: start})
  await page.clock.pauseAt(new Date(start.getTime() + 1000))
  await page.goto('/')
  const phone = page.getByRole('img', {name: /phone rotating/i})
  const seconds = page.getByRole('slider', {name: 'Watch time', exact: true})
  await expect(phone).toHaveAttribute('data-frame', '0')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', {name: 'Instagram', exact: true})).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', {name: 'Explore feed'})).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', {name: 'Watch all 12 s'})).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(seconds).toBeFocused()
  await page.keyboard.press('End')
  if (testInfo.project.use.reducedMotion !== 'reduce') {
    await page.clock.runFor(110)
    const frame = Number(await phone.getAttribute('data-frame'))
    expect(frame).toBeGreaterThan(0)
    expect(frame).toBeLessThan(23)
    await page.clock.runFor(850)
  }
  await expect(phone).toHaveAttribute('data-frame', '23')
  const lastStrip = phone.locator('img:visible')
  await expect(lastStrip).toHaveCount(1)
  await expect.poll(() => lastStrip.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
})


test('scroll follows the same evidence through learning, scoring and ranking', async ({page}, testInfo) => {
  await page.goto('/')
  const seconds = page.getByRole('slider', {name: 'Watch time', exact: true})
  await page.locator('.pe-stage').evaluate(el => {
    const bounds = el.getBoundingClientRect()
    window.scrollBy(0, bounds.top + bounds.height / 2)
  })
  await expect(seconds).toHaveValue('6')
  await expect(page.getByLabel('Gaming interest', {exact: true})).toHaveText('−1.90')
  await page.getByRole('link', {name: 'See how it works'}).press('Enter')
  await expect(page).toHaveURL(/#signals$/)
  await expect(seconds).toHaveValue('12')
  const nav = page.getByRole('navigation', {name: 'How the feed works'})
  const output = page.locator('.pe-readout')
  const mobile = testInfo.project.use.isMobile
  const chapterList = [['Signals', 'Raw signals'], ['Learning', 'Learned topic weights'], ['Scoring', 'Winning score breakdown'], ['Ranking', 'Before and after ranking']] as const
  const activeOutput = (chapter: string, name: string) => mobile
    ? page.locator('#' + chapter.toLowerCase()).getByLabel(name)
    : output.getByLabel(name)

  const session = phoneSession(12)
  const profile = replay(session.events, session.settings)
  const [winner] = rank(profile, session.seen, session.settings)
  for (const [index, [name, label]] of chapterList.entries()) {
    if (index > 0) {
      // Enter the next chapter by scrolling, without changing the hash.
      await page.locator('#' + name.toLowerCase()).evaluate(el => el.scrollIntoView({block: 'start'}))
    }
    await expect(nav.getByRole('link', {name})).toHaveAttribute('aria-current', 'step')
    await expect(page).toHaveURL(/#signals$/)
    const readout = activeOutput(name, label)
    await expect(readout).toBeVisible()
    if (name === 'Learning') {
      await expect(readout).toContainText('GamingMain topic+' + profile.Gaming.toFixed(2))
      await expect(readout).toContainText('TechRelated topic+' + profile.Tech.toFixed(2))
    }
    if (name === 'Scoring') {
      await expect(readout).toContainText(winner.post.title)
      await expect(readout).toContainText(winner.total.toFixed(2))
      await expect(readout).toContainText('+' + winner.parts.relevance.toFixed(2))
    }
    if (name === 'Ranking') {
      const before = phoneSession(0)
      const [previous] = rank(replay(before.events, before.settings), before.seen, before.settings)
      await expect(readout.getByRole('row', {name: new RegExp(previous.post.title), includeHidden: true}).getByRole('cell', {includeHidden: true}).first()).toContainText('#1')
      await expect(readout.getByRole('row', {name: new RegExp(winner.post.title), includeHidden: true}).getByRole('cell', {includeHidden: true}).last()).toContainText('#1')
    }
  }
  await page.getByRole('button', {name: 'Explore this ranking in the simulator'}).click()
  await expect(page.getByRole('group', {name: 'Watch time versus dislike'})).toContainText('Gaming +0.2')
  await page.goBack()
  await nav.getByRole('link', {name: 'Learning'}).press('Enter')
  await expect(page).toHaveURL(/#learning$/)
  await expect(nav.getByRole('link', {name: 'Learning'})).toHaveAttribute('aria-current', 'step')

  await seconds.press('Home')
  await seconds.press('ArrowRight')
  await nav.getByRole('link', {name: 'Ranking'}).press('Enter')
  await expect(nav.getByRole('link', {name: 'Ranking'})).toHaveAttribute('aria-current', 'step')
  const readout = activeOutput('Ranking', 'Before and after ranking')
  await expect(readout.getByRole('columnheader', {name: 'Watch 1 s + dislike', includeHidden: true})).toBeVisible()
  const short = phoneSession(1)
  const [shortWinner] = rank(replay(short.events, short.settings), short.seen, short.settings)
  await expect(readout.getByRole('row', {name: new RegExp(shortWinner.post.title), includeHidden: true}).getByRole('cell', {includeHidden: true}).last())
    .toContainText('#1' + shortWinner.total.toFixed(2))
})
