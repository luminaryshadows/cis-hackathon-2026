import {currentPost, fresh, update} from './session.ts'

export function phoneSession(seconds: number) {
  let session = fresh()
  const duration = Math.min(Math.floor(seconds), currentPost(session).duration)
  if (duration > 0) {
    session = update(session, {type: 'play'})
    for (let elapsed = 0; elapsed < duration; elapsed++) {
      session = update(session, {type: 'tick'})
    }
    session = update(session, {type: 'pause'})
  }
  return update(session, {type: 'dislike'})
}
