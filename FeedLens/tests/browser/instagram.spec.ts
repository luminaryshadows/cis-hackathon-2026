import {expect, test} from '@playwright/test'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {BlobWriter, TextReader, ZipWriter} from '@zip.js/zip.js/lib/zip-core-native.js'
import type {ImportFile} from '../../src/instagramImport.worker'

function jsonFile(name: string, rows: unknown) {
  return {name, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(rows))}
}
const event = {title: 'camera.club', string_list_data: [{timestamp: 1_700_000_000}]}

test('open the analyzer from the story, compare the example and clear it', async ({page, context}) => {
  await page.goto('/')
  await page.getByRole('link', {name: 'Instagram', exact: true}).click()
  const title = page.getByRole('heading', {name: 'Who shows up in your feed?'})
  await expect(page).toHaveURL(/#instagram$/)
  await expect(title).toBeFocused()
  await expect(title).toBeInViewport()
  await page.getByText('How to get your Instagram data').click()
  await expect(page.getByRole('link', {name: 'Instagram’s export guide'})).toBeVisible()
  await page.getByText('How to get your Instagram data').click()
  // The report remains usable after the site loses its connection.
  await context.setOffline(true)
  await page.getByRole('button', {name: 'Try example data'}).click()
  const report = page.getByRole('region', {name: 'Example activity'})
  await expect(report).toContainText('@pocket.arcade appeared in 56% of the view records that named an account (5 of 9).')
  await expect(report.locator('dd')).toHaveText(['6', '3', '3', '1'])
  await expect(report.getByRole('region', {name: 'Accounts you saw most'}).getByRole('listitem').first()).toHaveText('@pocket.arcade5')
  await expect(report.getByRole('region', {name: 'Accounts you liked or saved most'}).getByRole('listitem').first()).toHaveText('@clay.studio3')
  await page.getByRole('button', {name: 'Clear data'}).click()
  await expect(report).toHaveCount(0)
  await expect(page.getByLabel('Choose Instagram export')).toBeFocused()
})

test('an incomplete export distinguishes missing categories, empty files and invalid selections', async ({page, context}) => {
  await page.goto('/#instagram')
  await page.evaluate(() => document.fonts.ready)
  const requests: string[] = []
  const workerOrigin = 'blob:' + new URL(page.url()).origin + '/'
  context.on('request', request => {
    if (!request.url().startsWith(workerOrigin)) requests.push(request.url())
  })
  page.on('websocket', socket => requests.push(socket.url()))
  const picker = page.getByLabel('Choose Instagram export')
  await picker.setInputFiles(jsonFile('message_1.json', {message: 'unrelated'}))
  await expect(page.getByRole('alert')).toContainText('No supported Instagram activity')
  await picker.setInputFiles(jsonFile('liked_posts.json', {unexpected: []}))
  await expect(page.getByRole('alert')).toContainText('could not be recognized')

  await picker.setInputFiles([
    jsonFile('liked_posts.json', {likes_media_likes: [event]}),
    jsonFile('saved_posts.json', {saved_saved_media: []}),
  ])
  const report = page.getByRole('region', {name: 'Your activity'})
  await expect(report.locator('dd')).toHaveText(['Not included', 'Not included', '1', '0'])
  await expect(report).toContainText('1 record')
  await expect(report).toContainText('14 Nov 2023')
  await expect(report.getByRole('region', {name: 'Accounts you saw most'})).toContainText('absent')
  await expect(report.getByRole('listitem')).toHaveText('@camera.club1')
  expect(requests).toEqual([])
  expect(await page.evaluate(() => sessionStorage.length)).toBe(0)
  expect(await context.storageState({indexedDB: true})).toEqual({cookies: [], origins: []})
  await page.reload()
  await expect(page.getByRole('heading', {name: 'Who shows up in your feed?'})).toBeInViewport()
  await expect(report).toHaveCount(0)
})

test('a compressed export opens in the standalone file offline and only its activity is shown', async ({page, context}) => {
  const writer = new ZipWriter(new BlobWriter(), {useWebWorkers: false})
  const viewed = {string_map_data: {Author: {value: 'frame.study'}, Time: {timestamp: 1_700_000_000}}}
  await writer.add('export/ads_information/ads_and_topics/posts_viewed_1.json',
    new TextReader(JSON.stringify({impressions_history_posts_seen: [viewed, viewed]})))
  await writer.add('export/your_instagram_activity/messages/inbox/liked_posts.json',
    new TextReader(JSON.stringify({likes_media_likes: [{title: 'private_account'}]})))
  const zip = {name: 'instagram-part-1.zip', mimeType: 'application/zip', buffer: Buffer.from(await (await writer.close()).arrayBuffer())}
  const entry = pathToFileURL(resolve('..', 'FeedLens.html')).href
  const unexpectedRequests: string[] = []
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => {
    if (/^(https?|file):/.test(request.url()) && request.url().split('#')[0] !== entry) unexpectedRequests.push(request.url())
  })
  await context.setOffline(true)
  await page.goto(entry + '#instagram')
  await page.getByLabel('Choose Instagram export').setInputFiles([zip, jsonFile('liked_posts.json', {likes_media_likes: [event]})])
  const report = page.getByRole('region', {name: 'Your activity'})
  await expect(report.locator('dd')).toHaveText(['2', 'Not included', '1', 'Not included'])
  await expect(report.getByRole('listitem')).toHaveText(['@frame.study2', '@camera.club1'])
  await expect(page.locator('body')).not.toContainText('private_account')
  expect(unexpectedRequests).toEqual([])
  expect(errors).toEqual([])
})

test('canceling and replacing a pending import terminate its worker', async ({page}) => {
  await page.addInitScript(() => {
    let terminatedPendingWorkers = 0
    window.Worker = class extends Worker {
      pendingImport = false

      postMessage(files: ImportFile[]) {
        this.pendingImport = files[0]?.file.name === 'liked_posts_9.json'
        if (!this.pendingImport) super.postMessage(files)
      }

      terminate() {
        if (this.pendingImport) {
          document.documentElement.dataset.terminatedImports = String(++terminatedPendingWorkers)
        }
        super.terminate()
      }
    }
  })
  await page.goto('/#instagram')
  const picker = page.getByLabel('Choose Instagram export')
  await picker.setInputFiles(jsonFile('liked_posts_9.json', {likes_media_likes: [event]}))
  await expect(page.getByRole('button', {name: 'Cancel'})).toBeVisible()
  await page.getByRole('button', {name: 'Cancel'}).click()
  await expect(picker).toBeFocused()
  await expect(page.getByRole('button', {name: 'Cancel'})).toHaveCount(0)
  await expect(page.locator('html')).toHaveAttribute('data-terminated-imports', '1')
  await picker.setInputFiles(jsonFile('liked_posts_9.json', {likes_media_likes: [event]}))
  await expect(page.getByRole('button', {name: 'Cancel'})).toBeVisible()
  await page.getByRole('button', {name: 'Try example data'}).click()
  const report = page.getByRole('region', {name: 'Example activity'})
  await expect(report).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-terminated-imports', '2')
  await expect(report.locator('dd')).toHaveText(['6', '3', '3', '1'])
  await expect(page.getByRole('region', {name: 'Your activity'})).toHaveCount(0)
})
