import React, {useLayoutEffect, useMemo, useRef, useState} from 'react'
import {art} from './art'
import {eventContribution, eventWeight, postById, rank, replay} from './engine'
import type {Parts, Ranked, Settings} from './engine'
import {Icon} from './Icon'
import {factorLabels} from './rankingChange'
import {currentPost} from './session'
import type {Session} from './session'
import './behind.css'

const factors: [keyof Parts, keyof Settings, string][] = [
  ['relevance', 'personalization', 'Adds or subtracts points based on the interests this feed has learned.'],
  ['popularity', 'popularity', 'Gives more points to stories earlier in the edition’s starting order.'],
  ['exploration', 'exploration', 'Gives extra points to topics you’ve seen less often in this round.'],
  ['diversity', 'diversity', 'Subtracts points for topics repeated in the last three stories.'],
]
const number = (n:number) => (Math.abs(n)<.005?0:n).toFixed(2)
const signed = (n:number) => (n>=.005?'+':'')+number(n)
const verbs = {like:'Liked',dislike:'Disliked',watch:'Watched',skip:'Skipped'}

function Lead({rows}:{rows:Ranked[]}) {
  const [a,b] = rows
  if (!b) return <p>Only one story is left in the queue.</p>
  const gap = a.total-b.total
  if (gap<1e-10) return <p>The top two have the same score. Their starting order breaks the tie.</p>
  const [key] = factors.reduce((best,f)=>a.parts[f[0]]-b.parts[f[0]]>a.parts[best[0]]-b.parts[best[0]]?f:best)
  return <p><b>{a.post.topic} leads.</b> {factorLabels[key]} gives the first story its biggest edge ({signed(a.parts[key]-b.parts[key])} points over #2).</p>
}

export function Behind({session:s,onChange,target}:{session:Session;onChange:(key:keyof Settings,value:number)=>void;target:string|null}) {
  const [picked,setPicked] = useState(target)
  const [all,setAll] = useState(false)
  const current = currentPost(s)
  const inspectCurrent = target===current.id
  const rows = useMemo(()=>rank(replay(s.events,s.settings),inspectCurrent?s.seen.slice(0,-1):s.seen,s.settings),[s.events,s.settings,s.seen,inspectCurrent])
  const index = Math.max(0,rows.findIndex(r=>r.post.id===picked))
  const row = rows[index]
  const visible = rows.filter((_,i)=>all || i<5 || i===index)
  const list = useRef<HTMLDivElement>(null)
  const inspectedTitle = useRef<HTMLHeadingElement>(null)
  function inspect(id: string) {
    setPicked(id)
    if (matchMedia('(max-width: 820px)').matches) {
      requestAnimationFrame(() => {
        inspectedTitle.current?.focus({preventScroll: true})
        inspectedTitle.current?.scrollIntoView({block: 'start'})
      })
    }
  }
  const previous = useRef(new Map<string,number>())
  useLayoutEffect(()=>{
    const positions = new Map<string,number>()
    for (const el of Array.from(list.current?.children??[]) as HTMLElement[]) {
      const id = el.dataset.id!, top = el.offsetTop
      positions.set(id,top)
      const last = previous.current.get(id)
      if (last!==undefined && last!==top && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        el.getAnimations().forEach(a=>a.cancel())
        el.animate([{transform:'translateY('+(last-top)+'px)'},{transform:'translateY(0)'}],{duration:300,easing:'ease-out'})
      }
    }
    previous.current = positions
  },[rows,all,index])

  if (!row) return <section className="bx-empty panel"><Icon name="queue"/><h2>The queue is empty</h2><p>Start another round in Your Feed to see fresh rankings.</p></section>
  const historical = inspectCurrent && row.post.id===current.id
  const peak = Math.max(.01,...Object.values(row.parts).map(Math.abs))
  const strongest = s.events.map(event=>({event,value:eventContribution(row.post,event,s.settings)}))
    .reduce<{event:Session['events'][number];value:number}|undefined>((best,next)=>Math.abs(next.value)>Math.abs(best?.value??0)?next:best,undefined)
  return <div className="bx">
    <div className="bx-grid">
      <section className="panel bx-inspector">
        <header><h2><span className="heading-icon mint"><Icon name="scan"/></span>Recommendation X-Ray</h2></header>
        <div className="bx-cover"><img src={art(row.post)} alt=""/><div><small>#{index+1} · {row.post.topic}{row.post.related?' + '+row.post.related:''}</small><h3 ref={inspectedTitle} tabIndex={-1}>{row.post.title}</h3></div></div>
        <div className="bx-score" role="group" aria-label="Live score"><span><span>Live score</span><small>Sum of the four factors below</small></span><strong>{number(row.total)} <small>pts</small></strong></div>
        <div className="bx-parts">{factors.map(([key])=><div key={key}><span>{factorLabels[key]}</span><span className="bx-track" aria-hidden="true"><i className={row.parts[key]<0?'negative':''} style={{width:Math.abs(row.parts[key])/peak*50+'%'}}/></span><b>{signed(row.parts[key])}</b></div>)}</div>
        {historical && <details className="bx-detail"><summary>When this post was selected</summary><p>It ranked #1 with {number(s.selected.total)} points. Its score then included {factors.map(([key])=>factorLabels[key].toLowerCase()+' '+signed(s.selected.parts[key])).join(', ')}.</p></details>}
        <details className="bx-detail"><summary>Which action changed this score?</summary>
          {strongest ? <>
            <p>Your action with the largest effect on this story’s score</p>
            <ol className="bx-path">
              <li><small>Action</small><b>{verbs[strongest.event.kind]} “{postById.get(strongest.event.postId)!.title}”{strongest.event.kind==='watch'?' for '+strongest.event.seconds+'s':''}</b></li>
              <li><small>Change in topic interest</small><b>{postById.get(strongest.event.postId)!.topic} {signed(eventWeight(strongest.event,s.settings))}</b></li>
              <li><small>Change in this story’s score</small><b>{signed(strongest.value)} interest match</b></li>
            </ol></> : <p>{s.events.length?'Your actions currently contribute zero points to this story.':'Watch, like, dislike or skip a story in Your Feed to start teaching it your interests.'}</p>}
          <p>An action changes interest in the story’s main topic. Any related topic receives a quarter of that change. The interest match slider controls how much that counts toward a story’s score.</p>
        </details>
      </section>
      <section className="panel bx-board">
        <header><h2><span className="heading-icon lilac"><Icon name="queue"/></span>Story rankings</h2><span>{rows.length} posts</span></header>
        <p className="bx-context">{inspectCurrent?'These stories were in the running when the current story was picked. The list uses your latest interests and settings.':'The highest-scoring unseen story goes next. Select any story to see how its score adds up.'}</p>
        <div className="bx-list" ref={list}>{visible.map(r=><button key={r.post.id} data-id={r.post.id} aria-pressed={r===row} onClick={()=>inspect(r.post.id)}>
          <span className="bx-rank">{rows.indexOf(r)+1}</span><img src={art(r.post)} alt=""/>
          <span className="bx-title"><b>{r.post.title}</b><small>{r.post.topic}</small></span><strong>{number(r.total)}<small>points</small></strong>
        </button>)}</div>
        {rows.length>5 && <button className="bx-more" onClick={()=>setAll(!all)} aria-expanded={all}>{all?'Show top five':'Show all '+rows.length+' stories'} <Icon name="chevron" size={15}/></button>}
        <div className="bx-lead"><Icon name="spark" size={19}/><Lead rows={rows}/></div>
      </section>
    </div>
    <section className="panel bx-tune"><header><h2><span className="heading-icon peach"><Icon name="sliders"/></span>Tune the ranking</h2></header>
      <p className="bx-context">Move a slider to change the scores here and in Your Feed.</p>
      <div className="bx-sliders">{factors.map(([key,setting,description])=><label key={key}><span>{factorLabels[key]}<b>{s.settings[setting]}%</b></span><input type="range" min="0" max="100" value={s.settings[setting]} aria-label={factorLabels[key]} aria-valuetext={s.settings[setting]+'%'} aria-describedby={'ranking-'+key} onChange={e=>onChange(setting,Number(e.target.value))}/><small id={'ranking-'+key}>{description}</small></label>)}</div>
    </section>
  </div>
}
