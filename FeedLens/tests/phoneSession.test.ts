import assert from 'node:assert/strict'
import test from 'node:test'
import {rank, replay} from '../src/engine.ts'
import {phoneSession} from '../src/phoneSession.ts'
import {currentPost} from '../src/session.ts'

test('scrubbing rebuilds one paused visit using the same watch and dislike as the feed', () => {
  for (const seconds of [0, 12, 11, 4, 0]) {
    const session = phoneSession(seconds)
    assert.equal(session.seconds, seconds)
    assert.equal(session.playing, false)
    assert.deepEqual(session.events.map(e => [e.kind, e.seconds]), seconds
      ? [['watch', seconds], ['dislike', seconds]] : [['dislike', 0]])
    assert.ok(session.events.every(e => e.visit === 1 && e.postId === currentPost(session).id))
    const profile = replay(session.events, session.settings)
    assert.ok(Math.abs(profile.Gaming - (0.35 * seconds - 4)) < 1e-10)
    assert.equal(profile.Tech, profile.Gaming / 4)
    const winner = rank(profile, session.seen, session.settings)[0]
    if (seconds === 0) assert.equal(winner.post.id, 'eclipse')
    if (seconds === 12) assert.equal(winner.post.id, 'synth')
  }
})

test('the watch slider uses whole seconds within the opening post', () => {
  for (const [input, expected] of [[-1, 0], [NaN, 0], [4.8, 4], [100, 12]]) {
    assert.equal(phoneSession(input).seconds, expected)
  }
})
