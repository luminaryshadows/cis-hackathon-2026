import React, {useState} from 'react'
import type {CSSProperties} from 'react'
import {Icon} from './Icon'
import {shares, topics} from './engine'
import type {Profile, Topic} from './engine'
import './live-panels.css'

const signed = new Intl.NumberFormat('en', {signDisplay: 'always', maximumSignificantDigits: 4})

// Stable anchors keep each topic recognizable as its share changes.
const anchors = [[55,48],[155,57],[254,44],[354,53]]
function Constellation({profile,percent}:{profile:Profile;percent:number[]}) {
  const [selected,setSelected] = useState<Topic>(topics[0])
  const points = anchors.map(([x,y],i)=>{
    const weight = percent[i]/100
    return {x:x+(i%2?1:-1)*5*weight,y:y-5*weight,r:10+22*Math.sqrt(weight)}
  })
  return <div className="sky">
    <svg className="star-map" viewBox="0 0 408 112" role="group" aria-label="Interest constellation">
      <g aria-hidden="true">{[[0,1],[1,2],[2,3]].map(([a,b])=>
        <line key={a+'-'+b} x1={points[a].x} y1={points[a].y} x2={points[b].x} y2={points[b].y}/>)}</g>
      {topics.map((topic,i)=>{
        const {x,y,r}=points[i]
        return <g key={topic} className="star" role="button" tabIndex={0}
          aria-label={topic+', '+percent[i]+' percent of learned interest'}
          aria-pressed={topic===selected} onMouseEnter={()=>setSelected(topic)} onClick={()=>setSelected(topic)}
          onFocus={()=>setSelected(topic)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(topic)}}}
          style={{transform:'translate('+x+'px,'+y+'px)'}}>
          <circle className="star-ring" r={r+3.5}/><circle className="star-body" r={r}/>
          <g transform="translate(-9 -9)"><Icon name={topic.toLowerCase()} size={18}/></g>
          <text y={r+16} textAnchor="middle">{topic}</text>
        </g>
      })}
    </svg>
    <div className="star-detail"><i/>{selected}<b>{percent[topics.indexOf(selected)]}% share</b><span>Learned weight {signed.format(profile[selected])}</span></div>
  </div>
}

export function InterestProfile({profile, note, revision, signalTopics}: {
  profile: Profile; note: string; revision: number; signalTopics: Topic[]
}) {
  const [stars, setStars] = useState(false)
  const [history, setHistory] = useState({revision, note, current: profile, previous: profile})
  if (history.revision !== revision || history.note !== note) {
    setHistory({revision, note, current: profile, previous: history.current})
  }
  const percent = shares(profile)
  const before = shares(history.previous)
  const rows = topics.map((topic, i) => ({topic, i})).sort((a, b) => profile[b.topic] - profile[a.topic])
  const changed = rows.filter(({topic}) => profile[topic] !== history.previous[topic])
  const main = signalTopics[0] ?? changed[0]?.topic
  const mainIndex = main === undefined ? -1 : topics.indexOf(main)
  const mention = mainIndex < 0 ? null :
    before[mainIndex] === percent[mainIndex] ? main + ' stays at ' + percent[mainIndex] + '% of the profile.' :
      main + ' went from ' + before[mainIndex] + '% to ' + percent[mainIndex] + '%.'
  return <section className="panel interest-profile" aria-labelledby="profile-heading">
    <header className="profile-heading">
      <h2 id="profile-heading">Interest profile</h2>
      <button type="button" className="profile-view" aria-pressed={stars} onClick={() => setStars(!stars)}>Constellation</button>
    </header>
    <p className="profile-caption">{revision > 0
      ? 'Each percentage is a share of the interests this feed has learned.'
      : 'Every topic starts equal. Your actions can change how much the feed favors each topic.'}</p>
    {revision > 0 && <div className="signal-note has-signal" role="status" aria-atomic="true">
      <span className="signal-content" key={revision}>{note}{mention && <> <strong>{mention}</strong></>}</span>
    </div>}
    {stars ? <Constellation profile={profile} percent={percent}/> : <ol role="list" className="interest-bars" style={{'--topics': rows.length} as CSSProperties}>
      {rows.map(({topic, i}, position) =>
        <li className="interest-row" key={topic} data-changed={changed.some(change => change.topic === topic) || undefined}
          style={{'--rank': position} as CSSProperties}>
          <span className="topic-label">{topic}</span>
          <span className="interest-meter" role="meter" aria-label={topic + ' interest share'}
            aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent[i]}
            aria-valuetext={percent[i] + '%' + (percent[i] !== before[i] ? ', previously ' + before[i] + '%' : '')}>
            <span className="track"><i style={{width: percent[i] + '%'}}/></span>
          </span>
          <b aria-hidden="true">{percent[i]}%</b>
        </li>
      )}
    </ol>}
  </section>
}
