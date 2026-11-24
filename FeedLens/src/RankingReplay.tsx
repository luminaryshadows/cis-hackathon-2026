import React, {useState} from 'react'
import type {CSSProperties} from 'react'
import type {Post, Ranked} from './engine'
import {art} from './art'
import {rankingChange} from './rankingChange'
import './ranking-replay.css'

export function RankingReplay({queue, onInspect}: {queue: Ranked[]; onInspect: (post: Post) => void}) {
  // Hold the two actual ranker outputs so scrubbing never rewrites the session.
  const [frames, setFrames] = useState<{before: Ranked[] | null; after: Ranked[]}>({before: null, after: queue})
  const [step, setStep] = useState<'Before' | 'After'>('After')
  if (queue !== frames.after) {
    setFrames({before: frames.after, after: queue})
    setStep('After')
  }
  const reviewing = step === 'Before'
  const rows = (reviewing && frames.before ? frames.before : queue).slice(0, 3)
  let caption = queue.length
    ? 'Select a post to see how it earned its score.'
    : 'You’ve reached the last post in this session.'
  if (reviewing) caption = 'Scores before your last change. Switch to After to inspect a score.'
  else if (frames.before) caption = rankingChange(frames.before, queue)

  return <section className="panel ranking-replay" aria-label="Ranking replay">
    <header>
      <h2>Up next</h2>
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
              <small>{post.topic}{moved && <> · From #{previous + 1}</>}</small>
            </span>
            <b className="replay-score">{total.toFixed(2)} <small>pts</small></b>
          </button>
        </li>
      })}
    </ol>}
    {rows.length > 0 && <button type="button" disabled={reviewing} className="replay-inspect" onClick={() => onInspect(rows[0].post)}>Why this winner? <span aria-hidden="true">↗</span></button>}
  </section>
}
