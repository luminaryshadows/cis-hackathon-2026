import {test, expect} from '@playwright/test'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {posts} from '../../src/catalog.ts'

const sections = [
  ['feed', 'Your Feed', 'World in photos'],
  ['behind', 'Behind the Feed', 'Recommendation X-Ray'],
  ['lab', 'Algorithm Lab', 'Does watching mean liking?'],
  ['history', 'Time Machine', 'Interaction timeline'],
] as const

for (const [id, title, content] of sections) {
  test(`the ${title} deep link opens the right view at the viewport width`, async ({page}) => {
    const navigation = page.getByRole('navigation', {name: 'Explore FeedLens'})
    await page.goto('/#' + id)
    await expect(page.getByRole('heading', {level: 1, name: title})).toBeVisible()
    await expect(page.getByRole('heading', {name: content, exact: true})).toBeVisible()
    await expect(navigation.getByRole('link', {name: title})).toHaveAttribute('aria-current', 'page')
    await expect(navigation.locator('[aria-current="page"]')).toHaveCount(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width)
  })
}

test('feed controls fit after a reaction at narrow and tablet widths', async ({page}, testInfo) => {
  const width = testInfo.project.use.isMobile ? 320 : 721
  await page.setViewportSize({width, height: 850})
  await page.goto('/#feed')
  await page.getByRole('button', {name: 'Dislike', exact: true}).click()
  await expect(page.getByRole('button', {name: 'Disliked', exact: true, pressed: true})).toBeVisible()
  const controls = page.getByRole('article', {name: 'Feed'}).locator('.actions')
  expect(await controls.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
})

test('navigate with the keyboard, open and dismiss help, and reset the session', async ({page}, testInfo) => {
  await page.goto('/#feed')
  await page.getByRole('button', {name: 'Like', exact: true}).press('Enter')
  const profile = page.getByRole('region', {name: 'Interest profile'})
  await expect(profile.getByRole('status')).toContainText('Liked')
  if (testInfo.project.use.reducedMotion === 'reduce') {
    expect(await profile.evaluate(el => el.getAnimations({subtree: true}))).toHaveLength(0)
  }
  const navigation = page.getByRole('navigation', {name: 'Explore FeedLens'})
  const history = navigation.getByRole('link', {name: 'Time Machine'})
  await history.press('Enter')
  await expect(page).toHaveURL(/#history$/)
  await expect(page.getByRole('heading', {level: 1, name: 'Time Machine'})).toBeFocused()
  await expect(page.getByRole('button', {name: /Liked .*Svalbard turns a laser on passing satellites/})).toBeVisible()

  await page.goBack()
  await expect(page.getByRole('button', {name: 'Liked', exact: true, pressed: true})).toBeVisible()
  const help = page.getByRole('button', {name: 'How it works'})
  await help.press('Enter')
  const dialog = page.getByRole('dialog', {name: 'How FeedLens works'})
  await expect(dialog).toBeVisible()
  const close = dialog.getByRole('button', {name: 'Close'})
  await expect(close).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(help).toBeFocused()

  await help.press('Enter')
  await close.press('Enter')
  await expect(dialog).toBeHidden()
  await expect(help).toBeFocused()

  await history.press('Enter')
  await page.getByRole('button', {name: /^Reset/}).press('Enter')
  await expect(page).toHaveURL(/#feed$/)
  await expect(page.getByRole('heading', {level: 1, name: 'Your Feed'})).toBeFocused()
  await expect(page.getByRole('button', {name: 'Like', exact: true, pressed: false})).toBeVisible()
  await history.press('Enter')
  await expect(page.getByRole('button', {name: /Liked .*Svalbard turns a laser on passing satellites/})).toHaveCount(0)
})

test('every story in the portable edition has a local photograph, source, date and credit', async ({page, context}) => {
  const requests: string[] = []
  page.on('request', request => {
    if (/^https?:/.test(request.url())) requests.push(request.url())
  })
  await context.setOffline(true)
  await page.goto(pathToFileURL(resolve('..', 'FeedLens.html')).href + '#feed')
  const feed = page.getByRole('article', {name: 'Feed'})
  const remaining = new Set(posts.map(post => post.title))
  for (let i = 0; i < posts.length; i++) {
    const title = await feed.locator('.caption h3').innerText()
    const story = posts.find(post => post.title === title)!
    expect(remaining.delete(title)).toBe(true)
    const photo = feed.getByRole('img', {name: story.alt, exact: true})
    await expect(photo).toHaveAttribute('src', /^data:image\/webp;base64,/)
    await expect.poll(() => photo.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
    await expect(feed.locator('.post-credit a')).toHaveAttribute('href', story.sourceUrl)
    await expect(feed.locator('.post-credit time')).toHaveAttribute('datetime', story.published)
    await expect(feed.getByRole('link', {name: story.photoCredit, exact: true})).toHaveAttribute('href', story.photoUrl)
    await feed.getByRole('button', {name: 'Skip', exact: true}).click()
  }
  await expect(feed.getByRole('heading', {name: 'Round complete'})).toBeVisible()
  expect(remaining.size).toBe(0)
  expect(requests).toEqual([])
})
