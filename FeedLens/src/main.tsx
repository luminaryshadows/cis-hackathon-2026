import React, {useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState} from 'react'
import {createRoot} from 'react-dom/client'
import {posts, rank, replay} from './engine'
import {displayDate, editionDate} from './catalog'
import type {Post} from './engine'
import {currentPost, fresh, reaction, update} from './session'
import type {Session} from './session'
import {phoneSession} from './phoneSession'
import {PhoneExperiment} from './PhoneExperiment'
import {InstagramAnalyzer} from './InstagramAnalyzer'
import {Icon} from './Icon'
import {art} from './art'
import {FeedControls, Lab} from './Lab'
import {TimeMachine} from './TimeMachine'
import {InterestProfile} from './LivePanels'
import {Behind} from './XRay'
import {RankingReplay} from './RankingReplay'
import {WatchDislike} from './WatchDislike'
import './style.css'

const time = (seconds:number) => '0:'+String(seconds).padStart(2,'0')

const sections = [
  {name:'Your Feed', short:'Feed', subtitle:'Like a story and see what moves up next. Start the timer to see how reading time counts, too.'},
  {name:'Behind the Feed', short:'Behind', subtitle:'Pick a post to trace its score back to your actions.'},
  {name:'Algorithm Lab', short:'Lab', subtitle:'Predict the next recommendation, then put the model to the test.'},
  {name:'Time Machine', short:'Time Machine', subtitle:'Change one past action and see how your feed could have turned out.'},
] as const
const sectionIds = ['feed','behind','lab','history']
const sectionFromHash = () => Math.max(0, sectionIds.indexOf(window.location.hash.slice(1)))

function Workspace({initial}:{initial:Session}) {
  const [s,dispatch] = useReducer(update,initial)
  const [sessionKey,setSessionKey] = useState(0)
  const [inspect,setInspect] = useState<string|null>(null)
  const [inspectionKey,setInspectionKey] = useState(0)
  const [section,setSection] = useState(sectionFromHash)
  const heading = useRef<HTMLHeadingElement>(null)
  const previousView = useRef({section, sessionKey})
  const dialog = useRef<HTMLDialogElement>(null)
  const player = useRef<HTMLDivElement>(null)
  const signal = useRef<HTMLSpanElement>(null)
  const actionBar = useRef<HTMLDivElement>(null)
  const sidebar = useRef<HTMLElement>(null)
  const post = currentPost(s)
  const feedback = reaction(s)?.kind
  const profile = useMemo(()=>replay(s.events,s.settings),[s.events,s.settings])
  const queue = useMemo(()=>rank(profile,s.seen,s.settings),[profile,s.seen,s.settings])
  useLayoutEffect(() => {
    const previous = previousView.current
    previousView.current = {section, sessionKey}
    if (previous.section === section && previous.sessionKey === sessionKey) return
    if (heading.current?.closest('[hidden]')) return
    heading.current?.focus({preventScroll: true})
    window.scrollTo(0, 0)
  }, [section, sessionKey])
  function navigate(page:number) {
    dispatch({type:'pause'})
    setSection(page)
    if (window.location.hash !== '#'+sectionIds[page]) window.location.hash = sectionIds[page]
    if (page === section) {
      heading.current?.focus({preventScroll: true})
      window.scrollTo(0, 0)
    }
  }
  useEffect(()=>{
    const change = () => {dispatch({type:'pause'});setSection(sectionFromHash())}
    window.addEventListener('hashchange',change)
    return ()=>window.removeEventListener('hashchange',change)
  },[])
  const next = () => dispatch({type:'next'})
  const reset = () => {setInspect(null);setSessionKey(key=>key+1);dispatch({type:'reset'});navigate(0)}
  const openXRay = (target:Post) => {setInspect(target.id);setInspectionKey(k=>k+1);navigate(1)}
  const onChange = (key:keyof typeof s.settings,value:number)=>dispatch({type:'setting',key,value})
  useEffect(() => {
    if (!s.playing) return
    const timer = window.setInterval(()=>dispatch({type:'tick'}),1000)
    const hide = () => {if (document.hidden) dispatch({type:'pause'})}
    document.addEventListener('visibilitychange',hide)
    const observer = new IntersectionObserver(([entry])=>{if (!entry.isIntersecting) dispatch({type:'pause'})})
    if (player.current) observer.observe(player.current)
    return () => {clearInterval(timer);document.removeEventListener('visibilitychange',hide);observer.disconnect()}
  },[s.playing])
  useEffect(() => {
    const el = player.current
    if (!el || s.done) return
    let last = -Infinity, distance = 0, fingerY = 0
    function wheel(e:WheelEvent) {
      if (e.ctrlKey || e.deltaY<=0 || Math.abs(e.deltaX)>e.deltaY) return
      e.preventDefault()
      if (performance.now()-last>200) distance=0
      last=performance.now()
      distance+=e.deltaY*(e.deltaMode===1?16:1)
      if (distance>50) {distance=-Infinity;next()}
    }
    function touchStart(e:TouchEvent) {fingerY=e.touches[0].clientY}
    function touchEnd(e:TouchEvent) {if(fingerY-e.changedTouches[0].clientY>60) next()}
    el.addEventListener('wheel',wheel,{passive:false});el.addEventListener('touchstart',touchStart,{passive:true});el.addEventListener('touchend',touchEnd)
    return () => {el.removeEventListener('wheel',wheel);el.removeEventListener('touchstart',touchStart);el.removeEventListener('touchend',touchEnd)}
  },[s.done,sessionKey])
  useEffect(()=>{
    if (!s.signalTopics.length || !signal.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const source = actionBar.current?.getBoundingClientRect()
    const target = sidebar.current?.getBoundingClientRect()
    if (!source || !target || source.bottom<0 || target.top+45>innerHeight || source.top>innerHeight) return
    const x=source.right-20, y=source.top+15, dx=target.left+24-x, dy=target.top+27-y
    const dot=signal.current
    dot.style.left=x+'px'; dot.style.top=y+'px'
    const animation=dot.animate([{opacity:0,transform:'scale(.5)'},{opacity:.9,offset:.2},
      {opacity:0,transform:'translate('+dx+'px,'+dy+'px) scale(.6)'}],{duration:520,easing:'ease-out'})
    return ()=>animation.cancel()
  },[s.revision,s.signalTopics])
  return <>
    <header className="top"><div className="top-inner"><a className="brand" href="#experiment" aria-label="Back to phone experiment"><Icon name="scan" size={24}/>FeedLens</a>
      <nav className="sections-nav" aria-label="Explore FeedLens">{sections.map((item,i)=><a key={item.name} href={'#'+sectionIds[i]} aria-label={item.name} aria-current={section===i?'page':undefined}
        onClick={e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();navigate(i)}}><span className="nav-full">{item.name}</span><span className="nav-short">{item.short}</span></a>)}</nav>
      <div className="nav"><button className="help" aria-label="How it works" title="How it works" onClick={()=>{dispatch({type:'pause'});dialog.current?.showModal()}}><Icon name="help" size={19}/></button>
      <button className="reset" onClick={reset}><Icon name="reset" size={16}/>Reset<span className="wide"> session</span></button></div></div></header>
    <main key={sessionKey}><section className={'intro intro-'+section} key={section}><div>
      <h1 ref={heading} tabIndex={-1}>{sections[section].name}</h1>
      <p>{sections[section].subtitle}</p></div>
      </section>
      <div hidden={section!==0}><div className="layout">
        <article className="feed" aria-label="Feed"><div className="feed-heading"><h2>World in photos</h2>
          <span className="counter"><time dateTime={editionDate}>{displayDate(editionDate)}</time> edition</span></div>
          {s.done ? <div className="finish"><Icon name="eye" size={44}/><h2>Round complete</h2><p>You’ve seen all {posts.length} posts. Start another round with the interests you’ve trained.</p><button className="reset" onClick={()=>dispatch({type:'round'})}><Icon name="play" size={16}/>Start new round</button></div> :
          <><div className="player" ref={player} aria-label={post.title}>
            <img key={post.id} className="poster" src={art(post)} alt={post.alt}/>
            <span className="badge"><Icon name={post.topic.toLowerCase()} size={17}/>{post.topic}</span>
            <span className="duration" aria-label={s.seconds+' of '+post.duration+' seconds spent reading'}><Icon name="clock" size={15}/>{time(s.seconds)} / {time(post.duration)}</span>
            <div className="progress"><i style={{width:100*s.seconds/post.duration+'%'}}/></div>
          </div>
          <div className="caption" key={post.id+'caption'}>
            <div className="post-credit"><a href={post.sourceUrl} target="_blank" rel="noreferrer" aria-label={'Read “'+post.title+'” from '+post.publisher+' (opens in a new tab)'}>{post.publisher} <span aria-hidden="true">↗</span></a><span aria-hidden="true">·</span><time dateTime={post.published}>{displayDate(post.published)}</time></div>
            <h3>{post.title}</h3><p className="story-summary">{post.summary}</p>
          </div>
          <div className="actions" ref={actionBar}>
          <button className={'like '+(feedback==='like'?'liked':'')} aria-pressed={feedback==='like'} onClick={()=>dispatch({type:'like'})}><Icon name="heart" size={19}/>{feedback==='like'?'Liked':'Like'}</button>
          <button className="dislike" aria-pressed={feedback==='dislike'} onClick={()=>dispatch({type:'dislike'})}><Icon name="dislike" size={17}/>{feedback==='dislike'?'Disliked':'Dislike'}</button>
          <button className="watch" disabled={s.seconds>=post.duration} onClick={()=>dispatch({type:'play'})}><Icon name={s.playing?'pause':'clock'} size={17}/>{s.playing?'Pause':s.seconds>=post.duration?'Timed':'Start timer'}</button>
          <button className="skip" onClick={next}>{feedback||s.seconds>=3?'Next':'Skip'}<Icon name="skip" size={16}/></button></div>
          {s.revision > 0 && queue.length > 0 && <button className="next-preview" onClick={() => document.getElementById('up-next-title')?.focus()}>
            <span>Up next</span><strong>{queue[0].post.title}</strong><span aria-hidden="true">↓</span>
          </button>}
          <WatchDislike session={s}/>
          <div className="story-notes">
            <p>Photo · <a href={post.photoUrl} target="_blank" rel="noreferrer">{post.photoCredit}</a>
              {' · '}{post.licenseUrl ? <a href={post.licenseUrl} target="_blank" rel="noreferrer">{post.photoLicense}</a> : post.photoLicense}</p>
            <button className="why" onClick={()=>openXRay(post)}>Why am I seeing this? <span aria-hidden="true">↗</span></button>
          </div>
          </>}
        </article>
      <aside ref={sidebar} aria-label="Recommendation analysis">
        <RankingReplay key={s.round} queue={queue} session={s} onInspect={openXRay}/>
        <InterestProfile profile={profile} note={s.note} revision={s.revision} signalTopics={s.signalTopics}/>
      </aside>
      <div className="feed-settings"><FeedControls settings={s.settings} onChange={onChange} scope="feed"/></div>
      </div></div>
      <div hidden={section!==1}><Behind key={inspectionKey} session={s} onChange={onChange} target={inspect}/></div>
      <div hidden={section!==2}><Lab settings={s.settings} onChange={onChange}/></div>
      <div hidden={section!==3}><TimeMachine session={s}/></div>
    </main><span className="travel-signal" aria-hidden="true" ref={signal}/>
    <dialog aria-labelledby="help-title" ref={dialog} onClick={e=>{if(e.target===dialog.current)dialog.current?.close()}}><div className="dialog-head"><h2 id="help-title">How FeedLens works</h2><button aria-label="Close" onClick={()=>dialog.current?.close()}><Icon name="close"/></button></div>
      <p>Tap <b>Like</b> on a photo story. Under <b>Up next</b>, compare <b>Before</b> and <b>After</b>. Choose a story to see how it earned its place.</p>
      <p><b>Start timer</b> counts each second you spend on the photo as interest in its topic. A dislike or a skip before three seconds lowers interest. Swipe up on the photo or select <b>Next</b> to move on.</p>
      <p>Open <b>Algorithm Lab</b> to change how the feed learns and ranks. In <b>Time Machine</b>, branch from a past reaction to see how a different signal changes the rankings.</p></dialog>
  </>
}
const locationSection = () => window.location.hash.slice(1)

function App() {
  const [hash, setHash] = useState(locationSection)
  const showWorkspace = sectionIds.includes(hash)
  const [visitedStory, setVisitedStory] = useState(!showWorkspace)
  const [initial, setInitial] = useState<Session | null>(() => showWorkspace ? fresh() : null)
  const [visit, setVisit] = useState(0)
  useEffect(() => {
    const change = () => {
      const next = locationSection()
      if (sectionIds.includes(next)) setInitial(session => session ?? fresh())
      else setVisitedStory(true)
      setHash(next)
    }
    window.addEventListener('hashchange', change)
    return () => window.removeEventListener('hashchange', change)
  }, [])
  const lastView = useRef(showWorkspace)
  useEffect(() => {
    const changedView = lastView.current !== showWorkspace
    lastView.current = showWorkspace
    const anchor = !showWorkspace && hash ? document.getElementById(hash) : null
    if (anchor?.closest('#experiment')) {
      anchor.scrollIntoView({block: 'start'})
      const heading = anchor.querySelector<HTMLElement>('h1, h2')
      if (heading) { heading.tabIndex = -1; heading.focus({preventScroll: true}) }
    } else if (changedView) {
      const title = document.getElementById(showWorkspace ? 'workspace' : 'experiment')?.querySelector('h1')
      if (title) { title.tabIndex = -1; title.focus({preventScroll: true}) }
      window.scrollTo(0, 0)
    }
  }, [hash, showWorkspace])
  function explore(seconds:number) {
    setInitial(phoneSession(seconds))
    setVisit(value => value + 1)
    window.location.hash = 'feed'
  }
  return <>
    {visitedStory && <div id="experiment" hidden={showWorkspace}>
      <PhoneExperiment onExplore={explore}><InstagramAnalyzer/></PhoneExperiment>
    </div>}
    {initial && <div id="workspace" hidden={!showWorkspace}><Workspace key={visit} initial={initial}/></div>}
    <footer className="edition-credits"><details><summary>Edition photo credits</summary>
      <p>Photographs are resized and may be cropped to fit the display.</p>
      <ul>{posts.map(post => <li key={post.id}><a href={post.photoUrl} target="_blank" rel="noreferrer">{post.title}</a> · {post.photoCredit}
        {' · '}{post.licenseUrl ? <a href={post.licenseUrl} target="_blank" rel="noreferrer">{post.photoLicense}</a> : post.photoLicense}</li>)}</ul>
    </details></footer>
  </>
}

createRoot(document.getElementById('root')!).render(<App/>)
