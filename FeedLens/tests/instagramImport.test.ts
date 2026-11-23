import test from 'node:test'
import assert from 'node:assert/strict'
import { BlobWriter, TextReader, ZipWriter } from '@zip.js/zip.js/lib/zip-core-native.js'
import { analyzeInstagramFiles } from '../src/instagramImport.ts'

const activity = JSON.stringify({
  impressions_history_posts_seen: [{ title: 'test_creator', timestamp: 1_700_000_000 }],
})
const activityPath = 'instagram-export/ads_information/ads_and_topics/posts_viewed.json'

async function archive(entries: Record<string, string>) {
  const writer = new ZipWriter(new BlobWriter(), { useWebWorkers: false })
  for (const [path, text] of Object.entries(entries)) {
    await writer.add(path, new TextReader(text))
  }
  return new File([await writer.close()], 'instagram.zip')
}

test('ZIP import extracts supported activity and skips unrelated or private entries', async () => {
  const privateActivity = activity.replace('test_creator', 'private_creator')
  const file = await archive({
    [activityPath]: activity,
    'instagram-export/your_instagram_activity/messages/message_1.json': 'privateMessage',
    'instagram-export/your_instagram_activity/messages/posts_viewed.json': privateActivity,
    'instagram-export/personal_information/posts_viewed.json': privateActivity,
    'instagram-export/media/posts_viewed.json': privateActivity,
    'instagram-export/media/image.jpg': 'unrelatedMedia',
    'instagram-export/start_here.html': '<p>Instagram export navigation</p>',
  })
  const summary = await analyzeInstagramFiles([file])
  assert.equal(summary.counts.postsViewed, 1)
  assert.equal(summary.filesRead, 1)
  assert.doesNotMatch(JSON.stringify(summary), /private_creator|privateMessage|unrelatedMedia/)
  assert.deepEqual(summary, await analyzeInstagramFiles([new File([activity], 'posts_viewed.json')]))
})

test('import ignores traversal-like paths in selected activity files', async () => {
  const file = new File([activity], 'posts_viewed.json')
  Object.defineProperty(file, 'webkitRelativePath', { value: 'instagram-export/../posts_viewed.json' })
  await assert.rejects(analyzeInstagramFiles([file]), /no supported/i)
})

test('malformed activity yields an empty summary with a safe file count', async () => {
  const file = await archive({ [activityPath]: 'privateMalformedText' })
  const summary = await analyzeInstagramFiles([file])
  assert.equal(summary.invalidFiles, 1)
  assert.equal(summary.total, 0)
  assert.equal(summary.coverage.postsViewed, false)
  assert.doesNotMatch(JSON.stringify(summary), /privateMalformedText|instagram-export/)
})

test('import reports HTML exports, corrupt ZIPs and unsupported selections', async () => {
  await assert.rejects(analyzeInstagramFiles([await archive({ 'start_here.html': '<p>Export</p>' })]), /request.*json format/i)
  await assert.rejects(analyzeInstagramFiles([new File(['bad zip'], 'instagram.zip')]), /zip could not be read/i)
  await assert.rejects(analyzeInstagramFiles([new File(['{}'], 'message_1.json')]), /no supported/i)
  await assert.rejects(analyzeInstagramFiles([]), /choose an instagram/i)
})

test('import checks decompressed size before extracting a supported activity entry', async () => {
  const maxSizePlusOne = 16 * 1024 * 1024 + 1
  const large = ' '.repeat(maxSizePlusOne)
  await assert.rejects(analyzeInstagramFiles([await archive({ [activityPath]: large })]), /exceeds 16 MB/)
  const file = await archive({
    [activityPath]: activity,
    'instagram-export/your_instagram_activity/messages/message_1.json': large,
  })
  assert.equal((await analyzeInstagramFiles([file])).counts.postsViewed, 1)
})

test('import supports cancellation before and during local file reads', async () => {
  const file = new File([activity], 'posts_viewed.json')
  const cancelled = new AbortController()
  cancelled.abort()
  await assert.rejects(analyzeInstagramFiles([file], cancelled.signal), { name: 'AbortError' })
  const active = new AbortController()
  const pending = analyzeInstagramFiles([file], active.signal)
  active.abort()
  await assert.rejects(pending, { name: 'AbortError' })
  const zipped = await archive({ [activityPath]: activity })
  const activeZip = new AbortController()
  const pendingZip = analyzeInstagramFiles([zipped], activeZip.signal)
  activeZip.abort()
  await assert.rejects(pendingZip, { name: 'AbortError' })
})

test('the import budget applies across the entire selection', async () => {
  const tiny = new File(['[]'], 'liked_posts.json')
  await assert.rejects(analyzeInstagramFiles(Array(25_001).fill(tiny)), /too many files selected/i)
  await assert.rejects(analyzeInstagramFiles(Array(257).fill(tiny)), /more than 256/i)
  // Exactly 64 MiB of activity is allowed; adding one more ordinary file exceeds it.
  const chunk = new File([new Uint8Array(16 * 1024 * 1024)], 'liked_posts.json')
  await assert.rejects(analyzeInstagramFiles([chunk, chunk, chunk, chunk, tiny]), /64 MB total/i)
})
