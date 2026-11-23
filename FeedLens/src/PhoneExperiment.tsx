import React, {useLayoutEffect, useRef, useState} from 'react'
import {art} from './art'
import {eventWeight, rank, replay} from './engine'
import {currentPost} from './session'
import {phoneSession} from './phoneSession'
import {Icon} from './Icon'
import strip0 from './assets/phone/strip-00.webp'
import strip1 from './assets/phone/strip-01.webp'
import strip2 from './assets/phone/strip-02.webp'
import strip3 from './assets/phone/strip-03.webp'
import './phone-experiment.css'

const strips = [strip0, strip1, strip2, strip3]
const lastFrame = strips.length * 6 - 1
const frequency = Math.sqrt(50)
const signed = (n: number) => (n < 0 ? '−' : '+') + Math.abs(n).toFixed(2)

function Turntable({target}: {target: number}) {
  const [frame, setFrame] = useState(0)
  const pose = useRef({position: 0, velocity: 0})
  useLayoutEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let request = 0
    function settle() {
      cancelAnimationFrame(request)
      pose.current = {position: target, velocity: 0}
      setFrame(Math.round(target))
    }
    function follow() {
      if (motion.matches) { settle(); return }
      const {position, velocity} = pose.current
      const offset = position - target
      const start = performance.now()
      function step(now: number) {
        const t = (now - start) / 1000
        if (t >= .85) { settle(); return }
        // Exact damped spring from the original phone tour. Retarget with its current velocity.
        const decay = Math.exp(-10 * t), cos = Math.cos(frequency * t), sin = Math.sin(frequency * t)
        pose.current = {
          position: target + decay * (offset * cos + (velocity + 10 * offset) * sin / frequency),
          velocity: decay * (velocity * cos - (10 * velocity + 150 * offset) * sin / frequency),
        }
        setFrame(Math.max(0, Math.min(lastFrame, Math.round(pose.current.position))))
        request = requestAnimationFrame(step)
      }
      if (offset !== 0 || velocity !== 0) request = requestAnimationFrame(step)
    }
    follow()
    motion.addEventListener('change', follow)
    return () => { cancelAnimationFrame(request); motion.removeEventListener('change', follow) }
  }, [target])

  return <div className="pe-phone" role="img" aria-label="Phone rotating from the gaming post on its display to its rear cameras as watch time increases" data-frame={frame}>
    {strips.map((url, i) => <img key={url} src={url} alt="" hidden={i !== Math.floor(frame / 6)}
      draggable={false} style={{left: -(frame % 6) * 100 + '%'}}/>)}
  </div>
}

export function PhoneExperiment({onExplore}: {onExplore: (seconds: number) => void}) {
  const [seconds, setSeconds] = useState(0)
  const session = phoneSession(seconds)
  const post = currentPost(session)
  const interests = replay(session.events, session.settings)
  const net = interests[post.topic]
  const dislike = session.events[session.events.length - 1]
  const penalty = eventWeight(dislike, session.settings)
  const perSecond = eventWeight({...dislike, kind: 'watch', seconds: 1}, session.settings)
  const first = rank(interests, session.seen, session.settings)[0]
  return <main className="phone-experiment">
    <header className="pe-header"><span className="pe-wordmark"><Icon name="scan" size={24}/>FeedLens</span>
      <button type="button" onClick={() => onExplore(seconds)}>Explore feed <span aria-hidden="true">↗</span></button></header>
    <div className="pe-stage">
      <div className="pe-story">
        <h1>One post. <em>Two signals.</em></h1>
        <p>You hit Dislike on a gaming post. That costs {Math.abs(penalty)} points. Every second you keep watching earns {perSecond} back.</p>
      </div>
      <Turntable target={seconds / post.duration * lastFrame}/>
      <div className="pe-control">
        <div className="pe-watch-row">
          <label htmlFor="phone-watch">Watch time <output htmlFor="phone-watch" aria-hidden="true">{seconds} s</output></label>
          <button type="button" className="pe-jump" onClick={() => setSeconds(seconds === post.duration ? 0 : post.duration)}>
            {seconds === post.duration ? 'Rewind' : 'Watch all ' + post.duration + ' s'}
          </button>
        </div>
        <input id="phone-watch" type="range" min={0} max={post.duration} step={1} value={seconds}
          aria-valuetext={seconds + (seconds === 1 ? ' second' : ' seconds')}
          onChange={e => setSeconds(e.currentTarget.valueAsNumber)}/>
        <div className="pe-scale" aria-hidden="true"><span>0 s</span><span>{post.duration} s</span></div>
      </div>
    </div>
    <section className="pe-results" data-ui aria-label="Experiment results" aria-live="polite" aria-atomic="true">
      <div className="pe-interest"><span>{post.topic} interest</span><div>
        <output aria-label="Gaming interest">{signed(net)}</output>
        <strong>{net > 0 ? 'Watch time wins.' : net < 0 ? 'The dislike wins.' : 'The signals balance.'}</strong>
      </div></div>
      <div className="pe-recommendation" role="group" aria-label="Next recommendation">
        <img src={art(first.post)} alt=""/>
        <div><span>Next recommendation</span><strong>{first.post.title}</strong><small>{first.post.topic} · {first.total.toFixed(2)} ranking points</small></div>
      </div>
    </section>
  </main>
}
