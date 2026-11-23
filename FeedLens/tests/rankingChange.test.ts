import assert from 'node:assert/strict'
import {test} from 'node:test'
import {defaults, neutral, rank, replay, posts} from '../src/engine.ts'
import {rankingChange} from '../src/rankingChange.ts'

test('ranking replay explains the actual winning post before and after a like', () => {
  const seen = [posts[0]]
  const before = rank(neutral(), seen, defaults)
  const profile = replay([{id: 1, postId: seen[0].id, visit: 1, kind: 'like', seconds: 0}], defaults)
  const after = rank(profile, seen, defaults)
  const oldIndex = before.findIndex(row => row.post.id === after[0].post.id)
  assert.ok(oldIndex > 0)
  assert.equal(rankingChange(before, after),
    '“' + after[0].post.title + '” rose from #' + (oldIndex + 1) + ' to #1. Interest match added ' +
    (after[0].parts.relevance - before[oldIndex].parts.relevance).toFixed(2) + ' points.')
  assert.match(rankingChange(after, after), /stayed at #1. Its score stayed the same/)
  assert.match(rankingChange([], after), /enters the queue at #1/)
  assert.match(rankingChange(after, []), /end of this queue/)
})
