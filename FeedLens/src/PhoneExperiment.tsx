import React, {useEffect, useLayoutEffect, useRef, useState} from 'react'
import type {ReactNode} from 'react'
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

  return <div className="pe-phone" role="img" aria-label="Phone rotating from the gaming post on its display to its rear cameras" data-frame={frame}>
    {strips.map((url, i) => <img key={url} src={url} alt="" hidden={i !== Math.floor(frame / 6)}
      draggable={false} style={{left: -(frame % 6) * 100 + '%'}}/>)}
  </div>
}

const chapterNames = ['Signals', 'Learning', 'Scoring', 'Ranking']
const chapterIds = ['signals', 'learning', 'scoring', 'ranking']
const factors = [
  ['relevance', 'Interest match'],
  ['popularity', 'Popularity'],
  ['exploration', 'Exploration'],
  ['diversity', 'Repeat penalty'],
] as const

function openingRanking(seconds: number) {
  const session = phoneSession(seconds)
  return rank(replay(session.events, session.settings), session.seen, session.settings)
}

const beforeRanking = openingRanking(0)

export function PhoneExperiment({onExplore, children}: {onExplore: (seconds: number) => void; children?: ReactNode}) {
  const [chosenSeconds, chooseTime] = useState<number | null>(null)
  const [scrollSeconds, setScrollSeconds] = useState(0)
  const seconds = chosenSeconds ?? scrollSeconds
  const [chapter, setChapter] = useState(0)
  const narrative = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const session = phoneSession(seconds)
  const post = currentPost(session)
  const interests = replay(session.events, session.settings)
  const net = interests[post.topic]
  const related = post.related!
  const dislike = session.events[session.events.length - 1]
  const penalty = eventWeight(dislike, session.settings)
  const perSecond = eventWeight({...dislike, kind: 'watch', seconds: 1}, session.settings)
  const comparison = rank(interests, session.seen, session.settings)
  const winner = comparison[0]
  const changedWinner = beforeRanking[0].post.id !== winner.post.id
  const contenders = [beforeRanking[0], changedWinner ? winner : comparison[1]]

  useEffect(() => {
    const chapters = Array.from(narrative.current!.querySelectorAll('section'))
    let request = 0
    function update() {
      const trigger = innerHeight * .44
      setChapter(chapters.reduce((active, el, i) => el.getBoundingClientRect().top <= trigger ? i : active, 0))
      const bounds = stage.current!.getBoundingClientRect()
      if (bounds.height) {
        const progress = Math.max(0, Math.min(1, -bounds.top / bounds.height))
        setScrollSeconds(Math.round(post.duration * progress))
      }
    }
    function schedule() {
      cancelAnimationFrame(request)
      request = requestAnimationFrame(update)
    }
    update()
    addEventListener('scroll', schedule, {passive: true})
    addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(request)
      removeEventListener('scroll', schedule)
      removeEventListener('resize', schedule)
    }
  }, [post.duration])

  const readouts = [
    <dl className="pe-ledger" aria-label="Raw signals">
      <div><dt>Watched {seconds} s</dt><dd>{signed(seconds * perSecond)}</dd></div>
      <div><dt>Disliked</dt><dd>{signed(penalty)}</dd></div>
      <div className="pe-total"><dt>Combined signal</dt><dd>{signed(net)}</dd></div>
    </dl>,
    <dl className="pe-ledger" aria-label="Learned topic weights">
      {[post.topic, related].map((topic, i) => <div key={topic}>
        <dt>{topic}<small>{i === 0 ? 'Main topic' : 'Related topic'}</small></dt>
        <dd>{signed(interests[topic])}</dd>
      </div>)}
    </dl>,
    <dl className="pe-ledger" aria-label="Winning score breakdown">
      <div className="pe-score-post"><dt><img src={art(winner.post)} alt=""/>{winner.post.title}</dt><dd>{winner.total.toFixed(2)}</dd></div>
      {factors.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{signed(winner.parts[key])}</dd></div>)}
    </dl>,
    <div className="pe-rank" aria-label="Before and after ranking">
      <table>
        <thead><tr><th scope="col">Post</th><th scope="col">Dislike only</th><th scope="col">Watch {seconds} s + dislike</th></tr></thead>
        <tbody>{contenders.map(({post: candidate}) => <tr key={candidate.id}>
          <th scope="row"><img src={art(candidate)} alt=""/>{candidate.title}</th>
          {[beforeRanking, comparison].map((queue, i) => {
            const index = queue.findIndex(row => row.post.id === candidate.id)
            return <td key={i} className={index === 0 ? 'pe-winner' : undefined}>
              <strong>#{index + 1}</strong><span>{queue[index].total.toFixed(2)} pts</span>
            </td>
          })}
        </tr>)}</tbody>
      </table>
    </div>,
  ]
  const headings = ['Your actions leave signals.', 'The feed updates your topic weights.', 'Every unseen post gets a score.', 'The top score wins.']
  const captions = [
    <>You disliked “{post.title}”. That subtracts {Math.abs(penalty)} points. Each second you watched adds {perSecond} back.</>,
    <>This post is tagged {post.topic} and {related}. The model adds the full signal to {post.topic} and a quarter of it to {related}.</>,
    <>The model adds interest match, popularity and an exploration boost. It deducts points for topics shown recently. Here’s the current winner’s breakdown.</>,
    <>Which post comes next? {changedWinner
      ? <>The watch boosts {related} interest, and “{winner.post.title}” moves into first place.</>
      : <>At {seconds} seconds, “{winner.post.title}” stays in first place.</>}</>,
  ]

  return <main className="phone-experiment">
    <header className="pe-header">
      <span className="pe-wordmark"><Icon name="scan" size={24}/>FeedLens</span>
      <nav aria-label="FeedLens">
        <a href="#instagram">Instagram</a>
        <button type="button" onClick={() => onExplore(seconds)}>Explore feed <span aria-hidden="true">↗</span></button>
      </nav>
    </header>
    <div className="pe-stage" ref={stage}>
      <div className="pe-story">
        <h1>Inside your feed.</h1>
        <p>You disliked this gaming post. Scroll to add watch time, or set it yourself. See which post the feed recommends next.</p>
      </div>
      <Turntable target={seconds / post.duration * lastFrame}/>
      <div className="pe-control">
        <div className="pe-watch-row">
          <label htmlFor="phone-watch">Watch time <output htmlFor="phone-watch" aria-hidden="true">{seconds} s</output></label>
          <button type="button" className="pe-jump" onClick={() => chooseTime(seconds === post.duration ? 0 : post.duration)}>
            {seconds === post.duration ? 'Rewind' : 'Watch all ' + post.duration + ' s'}
          </button>
        </div>
        <input id="phone-watch" type="range" min={0} max={post.duration} step={1} value={seconds}
          aria-valuetext={seconds + (seconds === 1 ? ' second' : ' seconds')}
          onChange={e => chooseTime(e.currentTarget.valueAsNumber)}/>
        <div className="pe-scale" aria-hidden="true"><span>0 s</span><span>{post.duration} s</span></div>
      </div>
    </div>
    <section className="pe-results" data-ui aria-label="Experiment results" aria-live={chosenSeconds === null ? 'off' : 'polite'} aria-atomic="true">
      <div className="pe-interest"><span>{post.topic} interest</span><div>
        <output aria-label="Gaming interest">{signed(net)}</output>
        <strong>{net > 0 ? 'Watch time wins.' : net < 0 ? 'The dislike wins.' : 'The signals balance.'}</strong>
      </div></div>
      <div className="pe-recommendation" role="group" aria-label="Next recommendation">
        <img src={art(winner.post)} alt=""/>
        <div><span>Next recommendation</span><strong>{winner.post.title}</strong><small>{winner.post.topic} · {winner.total.toFixed(2)} ranking points</small></div>
      </div>
    </section>
    <a className="pe-start" href="#signals">See how it works <span aria-hidden="true">↓</span></a>

    <div className="pe-narrative" ref={narrative}>
      <div className="pe-chapters">
        <nav className="pe-chapter-nav" aria-label="How the feed works">
          {chapterNames.map((name, i) => <a key={name} href={'#' + chapterIds[i]} aria-current={chapter === i ? 'step' : undefined}>{name}</a>)}
        </nav>
        {headings.map((heading, i) => <section className="pe-chapter" id={chapterIds[i]} key={heading} aria-labelledby={chapterIds[i] + '-title'} data-active={chapter === i}>
          <div>
            <h2 id={chapterIds[i] + '-title'}>{heading}</h2>
            <p>{captions[i]}</p>
            <div className="pe-inline" data-ui>{readouts[i]}</div>
          </div>
        </section>)}
      </div>
      <div className="pe-readout" data-ui data-chapter={chapterIds[chapter]} aria-hidden="true">
        <div className="pe-readout-content" key={chapter}>{readouts[chapter]}</div>
      </div>
    </div>
    <footer className="pe-end">
      <button type="button" className="pe-jump" onClick={() => onExplore(seconds)}>Explore this ranking in the simulator</button>
      <a href="#instagram">Analyze your Instagram export <span aria-hidden="true">↓</span></a>
    </footer>
    {children}
  </main>
}
