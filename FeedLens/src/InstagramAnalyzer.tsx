import React, {useEffect, useRef, useState} from 'react'
import type {InstagramActivityKind, InstagramSummary} from './instagram'
import {analyzeInstagramFilesInWorker} from './instagramImportWorker'
import './instagram-analyzer.css'

const categories: [InstagramActivityKind, string][] = [
  ['postsViewed', 'Posts viewed'], ['videosWatched', 'Videos watched'],
  ['likedPosts', 'Post likes'], ['savedPosts', 'Post saves'],
]
const number = new Intl.NumberFormat('en')
const percentage = new Intl.NumberFormat('en', {style: 'percent', maximumSignificantDigits: 2})
const date = new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'})

// A small fictional export follows the same import path as files chosen on the device.
function exampleFiles(): File[] {
  const creators = ['pocket.arcade', 'clay.studio', 'needle.drop']
  const day = 1_778_371_200
  function views(accounts: number[]) {
    return accounts.map((account, i) => ({string_map_data: {
      Author: {value: creators[account]}, Time: {timestamp: day + i * 86400},
    }}))
  }
  const example = {
    'posts_viewed.json': {impressions_history_posts_seen: views([0, 1, 0, 2, 0, 1])},
    'videos_watched.json': {impressions_history_videos_watched: views([2, 0, 0])},
    'liked_posts.json': {likes_media_likes: [1, 1, 2].map((account, i) => ({
      title: creators[account], string_list_data: [{timestamp: day + i * 86400}],
    }))},
    'saved_posts.json': {saved_saved_media: [{
      title: creators[1], string_map_data: {'Saved on': {timestamp: day + 86400}},
    }]},
  }
  return Object.entries(example).map(([name, data]) => new File([JSON.stringify(data)], name, {type: 'application/json'}))
}

type ImportState = {type: 'idle' | 'reading'} | {type: 'error'; message: string}
  | {type: 'ready'; summary: InstagramSummary; example: boolean}

function CreatorList({title, rows, named, total, unique, included}: {
  title: string; rows: InstagramSummary['topSeen']; named: number; total: number; unique: number; included: boolean
}) {
  let note = 'These activity files were absent from the export.'
  if (included) {
    if (total === 0) note = 'The included files contained no readable activity.'
    else if (!named) note = 'These records did not name any accounts.'
    else note = number.format(unique) + (unique === 1 ? ' distinct account' : ' distinct accounts') +
      ' · ' + number.format(named) + ' of ' + number.format(total) + (total === 1 ? ' record names' : ' records name') + ' a creator.'
  }
  return <section className="ig-creators" aria-label={title}>
    <h4>{title}</h4>
    {rows.length > 0 && <ol>
      {rows.map(row => <li key={row.handle}>
        <div className="ig-account"><span>@{row.handle}</span><b>{number.format(row.count)}</b></div>
        <div className="ig-track" aria-hidden="true"><i style={{width: (row.count / named * 100) + '%'}}/></div>
      </li>)}
    </ol>}
    <p>{note}</p>
  </section>
}

function ActivityReport({report, example}: {report: InstagramSummary; example: boolean}) {
  const {counts, coverage, dateRange} = report
  const dates = dateRange && date.formatRange(new Date(dateRange.start), new Date(dateRange.end))
  const lead = report.topSeen[0]
  const notes: string[] = []
  if (report.invalidFiles) notes.push('Unreadable activity files · ' + number.format(report.invalidFiles))
  if (report.skippedRecords) notes.push('Unrecognized records skipped · ' + number.format(report.skippedRecords))
  if (report.limitedRecords) notes.push('Records beyond the reading limit · ' + number.format(report.limitedRecords) + '. Try a shorter date range.')
  if (report.duplicateFiles || report.duplicateRecords) notes.push('Repeated files and identifiable records shared across files were counted once.')
  return <section className="ig-report" aria-labelledby="ig-report-title">
    <header className="ig-report-heading">
      <h3 id="ig-report-title">{example ? 'Example activity' : 'Your activity'}</h3>
      <p>{number.format(report.total)} {report.total === 1 ? 'record' : 'records'}{dates && <> · {dates} (UTC)</>}</p>
    </header>
    {lead && <p className="ig-finding"><strong>@{lead.handle}</strong> appeared in {percentage.format(lead.count / report.seenWithCreator)} of the view records that named an account ({number.format(lead.count)} of {number.format(report.seenWithCreator)}).</p>}
    <dl className="ig-counts">
      {categories.map(([kind, label]) => <div key={kind}>
        <dt>{label}</dt>
        <dd className={coverage[kind] ? undefined : 'ig-missing'}>{coverage[kind] ? number.format(counts[kind]) : 'Not included'}</dd>
      </div>)}
    </dl>
    {report.total > 0 ? <div className="ig-comparison">
      <CreatorList title="Accounts you saw most" rows={report.topSeen} named={report.seenWithCreator}
        total={counts.postsViewed + counts.videosWatched} unique={report.uniqueSeenCreators} included={coverage.postsViewed || coverage.videosWatched}/>
      <CreatorList title="Accounts you liked or saved most" rows={report.topInteracted} named={report.interactedWithCreator}
        total={counts.likedPosts + counts.savedPosts} unique={report.uniqueInteractedCreators} included={coverage.likedPosts || coverage.savedPosts}/>
    </div> : <p className="ig-empty">There’s no readable activity in the included files. Try an export covering more dates.</p>}
    <p className="ig-context">Counts reflect the activity in this export. Instagram’s original feed order and ranking scores are unavailable here.</p>
    {notes.length > 0 && <details className="ig-notes">
      <summary>{report.invalidFiles || report.skippedRecords || report.limitedRecords ? 'Some activity was skipped' : 'Import notes'}</summary>
      <ul>{notes.map(note => <li key={note}>{note}</li>)}</ul>
    </details>}
  </section>
}

export function InstagramAnalyzer() {
  const [state, setState] = useState<ImportState>({type: 'idle'})
  const current = useRef<AbortController | null>(null)
  const picker = useRef<HTMLInputElement>(null)
  useEffect(() => () => current.current?.abort(), [])

  async function read(files: File[], example = false) {
    if (!files.length) return
    current.current?.abort()
    const controller = new AbortController()
    current.current = controller
    setState({type: 'reading'})
    try {
      const summary = await analyzeInstagramFilesInWorker(files, controller.signal)
      if (!controller.signal.aborted) {
        setState(summary.filesRead ? {type: 'ready', summary, example} : {
          type: 'error', message: 'The activity files could not be recognized. Choose the original JSON files from your Instagram export.',
        })
      }
    } catch (error) {
      if (!controller.signal.aborted) setState({type: 'error', message: error instanceof Error ? error.message : 'The export could not be read.'})
    } finally {
      if (current.current === controller) current.current = null
    }
  }
  function clear() {
    current.current?.abort()
    current.current = null
    setState({type: 'idle'})
    picker.current?.focus({preventScroll: true})
  }

  return <section id="instagram" className="ig-section" aria-labelledby="ig-title">
    <div className="ig-intro">
      <h2 id="ig-title" tabIndex={-1}>Who shows up in <em>your</em> feed?</h2>
      <div className="ig-import">
        <p>Find the accounts you saw most and the ones whose posts you liked or saved. Your Instagram export stays in this tab.</p>
        <div className="ig-actions">
          <label className="ig-choose">Choose Instagram export
            <input ref={picker} type="file" multiple accept=".zip,.json,application/zip,application/json"
              onChange={event => {
                const files = Array.from(event.currentTarget.files ?? [])
                event.currentTarget.value = ''
                void read(files)
              }}/>
          </label>
          <button type="button" onClick={() => void read(exampleFiles(), true)}>Try example data</button>
          {state.type === 'reading' && <button type="button" onClick={clear}>Cancel</button>}
          {state.type === 'ready' && <button type="button" onClick={clear}>Clear data</button>}
        </div>
        <p className="ig-format">Instagram ZIP or extracted activity JSON files</p>
        <details className="ig-help">
          <summary>How to get your Instagram data</summary>
          <ol>
            <li>In Instagram settings, open <b>Meta Account</b> or <b>Accounts Center</b>, then <b>Your information and permissions</b>.</li>
            <li>Choose <b>Export your information</b>, select your Instagram profile and export to your device. Select <b>JSON</b> and the dates you want to explore.</li>
            <li>Download the ZIP when it’s ready and choose it here. If it came in parts, select them together. You can also choose the extracted posts viewed, videos watched, liked posts or saved posts JSON files.</li>
          </ol>
          <a href="https://help.instagram.com/181231772500920" target="_blank" rel="noreferrer">Instagram’s export guide <span aria-hidden="true">↗</span></a>
        </details>
      </div>
    </div>
    <div role="status" className={state.type === 'reading' ? 'ig-status' : 'ig-sr-only'}>
      {state.type === 'reading' ? 'Reading activity on this device…' : state.type === 'ready' ? (state.example ? 'Example activity ready.' : 'Your activity is ready.') : ''}
    </div>
    {state.type === 'error' && <p className="ig-error" role="alert">{state.message}</p>}
    {state.type === 'ready' && <ActivityReport report={state.summary} example={state.example}/>}
  </section>
}
