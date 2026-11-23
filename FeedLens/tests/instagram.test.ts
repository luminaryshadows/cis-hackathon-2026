import test from 'node:test'
import assert from 'node:assert/strict'
import { createInstagramAnalyzer, matchInstagramFile } from '../src/instagram.ts'

test('reports records beyond the processing limit across activity files', () => {
  const analyzer = createInstagramAnalyzer()
  const rows = Array(250_000).fill(null)
  rows[0] = {title: 'frame.study', timestamp: 1700000000}
  analyzer.addFile('liked_posts.json', JSON.stringify(rows))
  analyzer.addFile('saved_posts.json', JSON.stringify([rows[0]]))
  const result = analyzer.summarize()
  assert.equal(result.counts.likedPosts, 1)
  assert.equal(result.counts.savedPosts, 0)
  assert.equal(result.skippedRecords, 249_999)
  assert.equal(result.limitedRecords, 1)
})

// Synthetic rows follow the shapes documented by the For You Data Hub ingestion tests.
test('aggregates classic and modern Instagram viewing and interaction records', () => {
  const analyzer = createInstagramAnalyzer()
  analyzer.addFile('ads_information/ads_and_topics/posts_viewed.json', JSON.stringify({
    impressions_history_posts_seen: [
      { string_map_data: { Author: { value: 'River.Photos' }, Time: { timestamp: 1700000000 } } },
      { media_map_data: { Account: { value: 'river.photos' }, Time: { timestamp: 1700000100 } } },
      { string_list_data: [{ timestamp: 1700000200 }] },
    ],
  }))
  analyzer.addFile('videos_watched.json', JSON.stringify([{
    label_values: [
      { label: 'URL', value: 'https://www.instagram.com/reel/SAMPLE1/' },
      { label: 'Caption', value: 'private-caption' },
      { title: 'Owner', dict: [{ dict: [
        { label: 'Name', value: 'River Photographer' },
        { label: 'Username', value: '@River.Photos' },
      ] }] },
    ],
    timestamp: 1700120000,
  }]))
  analyzer.addFile('your_instagram_activity/likes/liked_posts.json', JSON.stringify({
    likes_media_likes: [
      { title: 'River.Photos', string_list_data: [{ href: 'https://instagram.com/p/SAMPLE1/', timestamp: 1700170000 }] },
      { title: 'Woods', href: 'https://instagram.com/p/SAMPLE2/', string_map_data: { Timestamp: { timestamp: 1700170000 } } },
    ],
  }))
  analyzer.addFile('saved_posts.json', JSON.stringify({
    saved_saved_media: [{ title: 'woods', string_map_data: {
      'Saved on': { href: 'https://instagram.com/reel/SAMPLE2/', timestamp: 1700220000 },
    } }],
  }))

  const summary = analyzer.summarize()
  assert.deepEqual(summary.counts, { postsViewed: 3, videosWatched: 1, likedPosts: 2, savedPosts: 1 })
  assert.equal(summary.total, 7)
  assert.equal(summary.seenWithCreator, 3)
  assert.equal(summary.interactedWithCreator, 3)
  assert.deepEqual(summary.topSeen, [{ handle: 'river.photos', count: 3 }])
  assert.deepEqual(summary.topInteracted, [{ handle: 'woods', count: 2 }, { handle: 'river.photos', count: 1 }])
  assert.deepEqual(summary.dateRange, { start: '2023-11-14', end: '2023-11-17' })
  assert.doesNotMatch(JSON.stringify(summary), /private-caption|SAMPLE|http/)
})

test('accepts numbered supported files and tracks duplicates, malformed and missing data', () => {
  const analyzer = createInstagramAnalyzer()
  const record = { title: 'river.photos', href: 'https://instagram.com/p/STILL1/', timestamp: 1700000000 }
  const first = JSON.stringify([record])
  assert.equal(matchInstagramFile('folder/LIKED_POSTS_2.JSON'), 'likedPosts')
  assert.equal(matchInstagramFile('messages/inbox/cat/message_1.json'), null)
  assert.equal(matchInstagramFile('messages/inbox/cat/saved_posts.json'), null)
  assert.equal(matchInstagramFile('saved_posts.html'), null)
  analyzer.addFile('message_1.json', '[{"title":"private"}]')
  analyzer.addFile('liked_posts.json', first)
  analyzer.addFile('outer/liked_posts_2.json', first)
  analyzer.addFile('liked_posts_3.json', JSON.stringify([record, {
    title: 'https://instagram.com/irrelevant',
    href: 'https://instagram.com/reel/REEL1/',
    timestamp: '2024-02-31',
  }, { title: '<script>bad</script>', timestamp: -5 }, {}]))
  analyzer.addFile('saved_posts.json', '{"saved_saved_media":[]}')
  analyzer.addFile('posts_viewed.json', '{"messages":[]}')
  analyzer.addFile('videos_watched.json', '{')
  const summary = analyzer.summarize()
  assert.equal(summary.total, 2)
  assert.equal(summary.filesRead, 3)
  assert.equal(summary.duplicateFiles, 1)
  assert.equal(summary.duplicateRecords, 1)
  assert.equal(summary.emptyFiles, 1)
  assert.equal(summary.invalidFiles, 2)
  assert.equal(summary.skippedRecords, 2)
  assert.deepEqual(summary.dateRange, { start: '2023-11-14', end: '2023-11-14' })
  assert.deepEqual(summary.coverage, { postsViewed: false, videosWatched: false, likedPosts: true, savedPosts: true })
  assert.deepEqual(summary.topInteracted, [{ handle: 'river.photos', count: 1 }])
})

test('matches relative export paths and rejects malformed archive paths', () => {
  assert.equal(matchInstagramFile('export\\your_instagram_activity\\saved\\saved_posts.json'), 'savedPosts')
  for (const path of [
    '/saved_posts.json',
    'folder//saved_posts.json',
    './saved_posts.json',
    'folder/../saved_posts.json',
    'C:/saved_posts.json',
    'C:saved_posts.json',
    'folder\0/saved_posts.json',
  ]) {
    assert.equal(matchInstagramFile(path), null, path)
  }
})
