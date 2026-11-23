import type {Parts, Ranked} from './engine.ts'

const factors: [keyof Parts, string][] = [
  ['relevance', 'Interest match'], ['popularity', 'Popularity'],
  ['exploration', 'Exploration'], ['diversity', 'Diversity'],
]

export function rankingChange(before: Ranked[], after: Ranked[]): string {
  if (!after.length) return 'You’ve reached the end of this queue.'
  const winner = after[0]
  const oldIndex = before.findIndex(({post}) => post.id === winner.post.id)
  if (oldIndex < 0) return '“' + winner.post.title + '” enters the queue at #1.'
  const previous = before[oldIndex]
  const movement = oldIndex === 0 ? ' stayed at #1.' : ' rose from #' + (oldIndex + 1) + ' to #1.'
  const [factor, label] = factors.reduce((largest, current) =>
    Math.abs(winner.parts[current[0]] - previous.parts[current[0]]) >
    Math.abs(winner.parts[largest[0]] - previous.parts[largest[0]]) ? current : largest)
  const difference = winner.parts[factor] - previous.parts[factor]
  const cause = difference === 0 ? ' Its score stayed the same.' :
    ' ' + label + (difference > 0 ? ' added ' : ' took away ') +
    (Math.abs(difference) < .01 ? 'less than 0.01' : Math.abs(difference).toFixed(2)) + ' points.'
  return '“' + winner.post.title + '”' + movement + cause
}
