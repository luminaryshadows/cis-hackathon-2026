import assert from 'node:assert/strict'
import {test} from 'node:test'
import {defaults, neutral, rank, replay, posts} from '../src/engine.ts'
import {rankingChange} from '../src/rankingChange.ts'

test('ranking replay explains what changed using the actual scores after a like', () => {
  const seen = [posts[0]]
  const before = rank(neutral(), seen, defaults)
  const profile = replay([{id: 1, postId: seen[0].id, visit: 1, kind: 'like', seconds: 0}], defaults)
  const after = rank(profile, seen, defaults)
  const oldIndex = before.findIndex(row => row.post.id === after[0].post.id)
  const description = rankingChange(before, after, seen[0].topic)
  if (after[0].post.related === seen[0].topic) assert.match(description, new RegExp('also covers ' + seen[0].topic))
  assert.ok(description.includes(after[0].post.title))
  assert.ok(description.includes(after[0].post.topic))
  assert.match(description, oldIndex > 0 ? new RegExp('moves from #' + (oldIndex + 1) + ' to #1') : /stays at #1/)

  assert.match(rankingChange(after, after), /stays at #1. Its score stayed at/)
  assert.match(rankingChange([], after), /enters the queue at #1/)
  assert.match(rankingChange(after, []), /end of this queue/)
})

test('the topic penalty can change the order while the new leader’s own score stays the same', () => {
  const before = rank(neutral(), [], defaults).slice(0, 2)
  const newLeader = before[1]
  const oldLeader = before[0]
  const reduction = oldLeader.total - newLeader.total + 1
  const after = [newLeader, {
    ...oldLeader,
    total: oldLeader.total - reduction,
    parts: {...oldLeader.parts, diversity: oldLeader.parts.diversity - reduction},
  }]
  const description = rankingChange(before, after)
  assert.match(description, /moves from #2 to #1/)
  assert.ok(description.includes('repeat-topic penalty'))
  assert.ok(description.includes(reduction.toFixed(2) + ' points'))
  assert.match(rankingChange(before, [newLeader]), /The previous #1 left the queue/)
})
