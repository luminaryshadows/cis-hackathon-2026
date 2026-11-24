import type {Parts, Ranked, Topic} from './engine.ts'

export const factorLabels: Record<keyof Parts, string> = {
  relevance: 'Interest match',
  popularity: 'Edition order',
  exploration: 'Less-seen topics',
  diversity: 'Repeat-topic penalty',
}

const factors = Object.keys(factorLabels) as (keyof Parts)[]
const points = (value: number) => {
  const amount = Math.abs(value)
  return amount < .005 ? 'less than 0.01 points' : amount.toFixed(2) + ' points'
}

export function rankingChange(before: Ranked[], after: Ranked[], signalTopic?: Topic): string {
  if (!after.length) return 'You’ve reached the end of this queue.'
  const winner = after[0]
  const previousIndex = before.findIndex(({post}) => post.id === winner.post.id)
  const next = '“' + winner.post.title + '” (' + winner.post.topic + ')'
  if (previousIndex < 0) return next + ' enters the queue at #1 with ' + winner.total.toFixed(2) + ' points.'
  const previous = before[previousIndex]
  const movement = previousIndex === 0 ? ' stays at #1.' : ' moves from #' + (previousIndex + 1) + ' to #1.'
  const score = winner.total - previous.total
  const scoreChange = Math.abs(score) < 1e-10 ? ' Its score stayed at ' + winner.total.toFixed(2) + ' points.' :
    ' Its score went from ' + previous.total.toFixed(2) + ' to ' + winner.total.toFixed(2) + ' points.'

  const oldLeader = before[0]
  const remainingLeader = after.find(({post}) => post.id === oldLeader.post.id)
  if (previousIndex > 0 && !remainingLeader) return next + movement + ' The previous #1 left the queue.' + scoreChange

  const overtook = previousIndex > 0 && remainingLeader
  const changes = factors.map(key => ({
    key,
    value: (winner.parts[key] - previous.parts[key]) -
      (overtook ? remainingLeader.parts[key] - oldLeader.parts[key] : 0),
  }))
  const strength = (value: number) => overtook ? value : score < -1e-10 ? -value : Math.abs(value)
  const biggest = changes.reduce((best, current) =>
    strength(current.value) > strength(best.value) ? current : best)
  if (Math.abs(biggest.value) < 1e-10) return next + movement + scoreChange
  if (overtook && biggest.key === 'relevance' && signalTopic &&
      winner.parts.relevance > previous.parts.relevance &&
      (winner.post.topic === signalTopic || winner.post.related === signalTopic)) {
    const connection = winner.post.topic === signalTopic
      ? 'It covers ' + signalTopic
      : 'It’s a ' + winner.post.topic + ' story that also covers ' + signalTopic
    return '“' + winner.post.title + '”' + movement + ' ' + connection + ', a topic the feed now thinks you want more of.'
  }
  const factor = factorLabels[biggest.key]
  const cause = overtook
    ? ' It gained ' + points(biggest.value) + ' on the previous leader through ' + factor.toLowerCase() + '.'
    : ' ' + factor + (biggest.value > 0 ? ' added ' : ' subtracted ') + points(biggest.value) + '.'
  const link = biggest.key === 'relevance' && signalTopic !== undefined && signalTopic === winner.post.related
    ? ' It also covers ' + signalTopic + '.'
    : ''
  return next + movement + (overtook ? cause : scoreChange + cause) + link
}
