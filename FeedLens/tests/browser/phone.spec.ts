import {test, expect} from '@playwright/test'
import {rank, replay} from '../../src/engine.ts'
import {phoneSession} from '../../src/phoneSession.ts'

test('scrub the watch signal, then explore the same visit in the feed', async ({page}, testInfo) => {
  await page.goto('/')
  await expect(page.getByRole('heading', {level: 1, name: 'One post. Two signals.'})).toBeVisible()
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
