import React, {useState} from 'react'
import type {CSSProperties} from 'react'
import type {Post, Ranked} from './engine'
import {Icon} from './Icon'
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
  const rows = (step === 'Before' && frames.before ? frames.before : queue).slice(0, 2)
  const scores = [...(frames.before ?? []).slice(0, 2), ...queue.slice(0, 2)].map(row => row.total)
  const low = Math.min(0, ...scores)
  const span = Math.max(0, ...scores) - low || 1
  const zero = -low / span * 100

  return <section className="panel ranking-replay" aria-labelledby="replay-heading">
    <header>
      <h2 id="replay-heading"><Icon name="wave" size={23}/>Ranking replay</h2>
      <div className="replay-switch" role="group" aria-label="Compare rankings">
        {(['Before', 'After'] as const).map(frame => <button type="button" key={frame}
          aria-pressed={step === frame} disabled={frame === 'Before' && !frames.before}
          onClick={() => setStep(frame)}>{frame}</button>)}
      </div>
    </header>
    <p className="replay-caption">{frames.before ? 'Top recommendations ' + step.toLowerCase() + ' your last change.' : 'Like the post above to see how these rankings change.'}</p>
    <ol role="list" aria-label={step + ' ranking'} style={{'--count': rows.length} as CSSProperties}>
      {rows.map(({post, total}, i) => <li key={post.id} data-id={post.id} data-score={total}
        className={post.topic.toLowerCase()} style={{'--place': i} as CSSProperties}>
        <span className="replay-place">#{i + 1}</span>
        <div className="replay-row"><span className="replay-title">{post.title}</span>
          <b>{total.toFixed(2)} <small>pts</small></b>
          <div className="replay-track" aria-hidden="true">
            <i className={total < 0 ? 'negative' : undefined} style={{left: (total < 0 ? (total - low) / span * 100 : zero) + '%', width: Math.abs(total) / span * 100 + '%'}}/>
            <span style={{left: zero + '%'}}/>
          </div>
        </div>
      </li>)}
    </ol>
    {frames.before && <p className="replay-result" role="status">{rankingChange(frames.before, queue)}</p>}
    {rows.length > 0 && <button type="button" disabled={step === 'Before'} className="replay-inspect" onClick={() => onInspect(rows[0].post)}>Why this winner? <span aria-hidden="true">↗</span></button>}
  </section>
}
