import React, {useState} from 'react'
import type {CSSProperties} from 'react'
import type {Post, Ranked, Topic} from './engine'
import type {Session} from './session'
import {art} from './art'
import {rankingChange} from './rankingChange'
import './ranking-replay.css'

export function RankingReplay({queue, session, onInspect}: {
  queue: Ranked[]; session: Session; onInspect: (post: Post) => void
}) {
  // Store the actual queue on each side of the update, including posts that have since left it.
  const [frames, setFrames] = useState({before: null as Ranked[] | null, after: queue, seen: session.seen, revision: session.revision, advanced: false, signalTopic: undefined as Topic | undefined})
  const [step, setStep] = useState<'Before' | 'After'>('After')
  if (queue !== frames.after) {
    setFrames({
      before: frames.after, after: queue, seen: session.seen, revision: session.revision,
      advanced: frames.seen !== session.seen,
      signalTopic: session.revision !== frames.revision ? session.signalTopics[0] : undefined,
    })
    setStep('After')
  }
  const reviewing = step === 'Before'
  const rows = (reviewing && frames.before ? frames.before : queue).slice(0, 3)
  let caption = session.events.length
    ? 'Highest score goes first. Open any story to see its score.'
    : 'Highest score goes next. With equal interests, edition order and topic variety set the first ranking.'
  if (!queue.length) caption = 'You’ve reached the end of this queue.'
  if (reviewing) caption = frames.advanced ? 'The order before you moved to the next story.' : 'The order before your latest update.'
  else if (frames.before) caption = rankingChange(frames.before, queue, frames.signalTopic)

  return <section className="panel ranking-replay" aria-label="Ranking replay">
    <header>
      <h2 id="up-next-title" tabIndex={-1}>Up next</h2>
      <div className="replay-switch" role="group" aria-label="Compare rankings">
        {(['Before', 'After'] as const).map(frame => <button type="button" key={frame}
          aria-pressed={step === frame} disabled={frame === 'Before' && !frames.before}
          onClick={() => setStep(frame)}>{frame}</button>)}
      </div>
    </header>
    <p className={frames.before && !reviewing ? 'replay-result' : 'replay-caption'} role="status">{caption}</p>
    {rows.length > 0 && <ol role="list" aria-label={step + ' ranking'} style={{'--count': rows.length} as CSSProperties}>
      {rows.map(({post, total}, i) => {
        const previous = frames.before?.findIndex(row => row.post.id === post.id)
        const moved = !reviewing && previous !== undefined && previous >= 0 && previous !== i
        return <li key={post.id} data-id={post.id} data-score={total} style={{'--place': i} as CSSProperties}>
          <button type="button" className="replay-row" disabled={reviewing}
            aria-label={'Inspect ' + post.title + ', ' + post.topic + ', ranked ' + (i + 1) + (moved ? ', previously ' + (previous + 1) : '') + ', ' + total.toFixed(2) + ' points'}
            onClick={() => onInspect(post)}>
            <span className="replay-place">#{i + 1}</span>
            <img src={art(post)} alt=""/>
            <span className="replay-details">
              <strong>{post.title}</strong>
              <small>{post.topic}{moved && <> · Was #{previous + 1}</>}</small>
            </span>
            <b className="replay-score">{total.toFixed(2)} <small>pts</small></b>
          </button>
        </li>
      })}
    </ol>}
    {rows.length > 0 && <button type="button" disabled={reviewing} className="replay-inspect" onClick={() => onInspect(rows[0].post)}>Why this post? <span aria-hidden="true">↗</span></button>}
  </section>
}
