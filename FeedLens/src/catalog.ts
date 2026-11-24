import {earthSpaceStories} from './earthSpaceStories.ts'
import {citySportStories} from './citySportStories.ts'

export const topics = ['Earth', 'Cities', 'Space', 'Sport'] as const
export type Topic = typeof topics[number]
export type Post = {
  id: string
  title: string
  summary: string
  topic: Topic
  related?: Topic
  publisher: string
  published: string
  sourceUrl: string
  alt: string
  photoCredit: string
  photoUrl: string
  photoLicense: string
  licenseUrl?: string
  duration: number
  discovery: number
}

export const editionDate = '2026-11-24'
const dateFormat = new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'})
export const displayDate = (iso: string) => dateFormat.format(new Date(iso + 'T00:00:00Z'))

const stories = [...earthSpaceStories, ...citySportStories]
// Take one editor-selected story from each desk before drawing a second from any desk.
const desks = topics.map(topic => stories.filter(story => story.topic === topic))
const edition = Array.from({length: Math.max(...desks.map(desk => desk.length))}, (_, index) =>
  desks.flatMap(desk => desk.slice(index, index + 1))).flat()
export const posts: Post[] = edition.map((story, i) => ({
  ...story, duration: 12, discovery: 1 - i / edition.length,
}))
