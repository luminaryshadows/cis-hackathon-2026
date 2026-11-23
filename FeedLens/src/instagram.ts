const activityFiles = {
  posts_viewed: { kind: 'postsViewed', key: 'impressions_history_posts_seen' },
  videos_watched: { kind: 'videosWatched', key: 'impressions_history_videos_watched' },
  liked_posts: { kind: 'likedPosts', key: 'likes_media_likes' },
  saved_posts: { kind: 'savedPosts', key: 'saved_saved_media' },
} as const

export type InstagramActivityKind = (typeof activityFiles)[keyof typeof activityFiles]['kind']
type CreatorCount = { handle: string; count: number }

export type InstagramSummary = {
  counts: Record<InstagramActivityKind, number>
  coverage: Record<InstagramActivityKind, boolean>
  total: number
  dateRange: { start: string; end: string } | null
  topSeen: CreatorCount[]
  topInteracted: CreatorCount[]
  seenWithCreator: number
  interactedWithCreator: number
  uniqueSeenCreators: number
  uniqueInteractedCreators: number
  filesRead: number
  emptyFiles: number
  invalidFiles: number
  duplicateFiles: number
  duplicateRecords: number
  skippedRecords: number
  limitedRecords: number
}

function activityFile(path: string) {
  const parts = path.toLowerCase().split(/[/\\]/)
  if (parts.some(part => !part || part === '.' || part === '..' || part.includes('\0') || /^[a-z]:/.test(part))) return null
  const filename = parts.pop() ?? ''
  if (parts.some(part => ['messages', 'media', 'personal_information'].includes(part))) return null
  const base = /^(posts_viewed|videos_watched|liked_posts|saved_posts)(?:_\d+)?\.json$/.exec(filename)?.[1]
  return base ? activityFiles[base as keyof typeof activityFiles] : null
}

export function matchInstagramFile(path: string): InstagramActivityKind | null {
  return activityFile(path)?.kind ?? null
}

function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function handle(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 40) return null
  const normalized = value.trim().replace(/^@/, '').toLowerCase()
  return /^(?!.*\.\.)[a-z0-9_](?:[a-z0-9_.]{0,28}[a-z0-9_])?$/.test(normalized) ? normalized : null
}

function timestamp(value: unknown): number | null {
  if (typeof value === 'string' && /^\d{10,13}$/.test(value)) value = Number(value)
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value)) {
    const day = new Date(value.slice(0, 10))
    if (Number.isFinite(+day) && day.toISOString().slice(0, 10) === value.slice(0, 10)) value = Date.parse(value)
  }
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) return null
  const ms = value < 1e11 ? value * 1000 : value
  return ms >= Date.UTC(2010, 0, 1) && ms < Date.UTC(2100, 0, 1) ? ms : null
}

function postId(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048) return null
  return /^https?:\/\/(?:(?:www|m)\.)?instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]{1,32})(?:[/?#]|$)/i.exec(value)?.[1] ?? null
}

function extract(value: unknown) {
  const row = object(value)
  let creator: string | null = null
  let time = timestamp(row.timestamp)
  let id = postId(row.href)

  for (const value of list(row.label_values)) {
    const entry = object(value)
    if (entry.label === 'URL') id ??= postId(entry.value) ?? postId(entry.href)
    if (entry.label === 'Time' || entry.label === 'Timestamp') {
      time ??= timestamp(entry.timestamp) ?? timestamp(entry.value)
    }
    if (entry.label === 'Username' || entry.label === 'Media Owner' || entry.label === 'Author') {
      creator ??= handle(entry.value)
    }
    if (entry.title === 'Owner') {
      for (const outer of list(entry.dict)) {
        const group = object(outer)
        if (group.label === 'Username') creator ??= handle(group.value)
        for (const inner of list(group.dict)) {
          const field = object(inner)
          if (field.label === 'Username') creator ??= handle(field.value)
        }
      }
    }
  }

  for (const map of [object(row.string_map_data), object(row.media_map_data)]) {
    for (const [key, value] of Object.entries(map)) {
      const entry = object(value)
      time ??= timestamp(entry.timestamp)
      id ??= postId(entry.href)
      if (['Username', 'Media Owner', 'Author', 'Account', 'Owner'].includes(key)) {
        creator ??= handle(entry.value)
      }
    }
  }

  const first = object(list(row.string_list_data)[0])
  time ??= timestamp(first.timestamp)
  id ??= postId(first.href)
  if (!Array.isArray(row.label_values)) creator ??= handle(row.title)
  return { creator, time, id }
}

function topCreators(creators: Map<string, number>): CreatorCount[] {
  return Array.from(creators, ([handle, count]) => ({ handle, count }))
    .sort((a, b) => b.count - a.count || a.handle.localeCompare(b.handle))
    .slice(0, 5)
}

function fingerprint(json: string): string {
  // Keep a compact identity for duplicate file selections without retaining their contents.
  let first = 2166136261
  let second = 5381
  for (let i = 0; i < json.length; i++) {
    const char = json.charCodeAt(i)
    first = Math.imul(first ^ char, 16777619)
    second = Math.imul(second, 33) ^ char
  }
  return `${json.length}:${first}:${second}`
}

const MAX_RECORDS = 250_000

export function createInstagramAnalyzer() {
  const counts = { postsViewed: 0, videosWatched: 0, likedPosts: 0, savedPosts: 0 }
  const coverage = { postsViewed: false, videosWatched: false, likedPosts: false, savedPosts: false }
  const seen = new Map<string, number>()
  const interacted = new Map<string, number>()
  const fileIds = new Set<string>()
  const activityIds = new Map<string, number>()
  let seenWithCreator = 0
  let interactedWithCreator = 0
  let filesRead = 0
  let emptyFiles = 0
  let invalidFiles = 0
  let duplicateFiles = 0
  let duplicateRecords = 0
  let skippedRecords = 0
  let limitedRecords = 0
  let processedRecords = 0
  let first = Infinity
  let last = -Infinity

  return {
    addFile(path: string, json: string): void {
      const activity = activityFile(path)
      if (!activity) return
      let payload: unknown
      try {
        payload = JSON.parse(json.replace(/^\uFEFF/, ''))
      } catch {
        invalidFiles++
        return
      }
      const root = object(payload)
      const rows = Array.isArray(payload) ? payload : root[activity.key]
      const single = ['label_values', 'string_map_data', 'string_list_data', 'media_map_data']
        .some(key => Object.hasOwn(root, key))
      const records = Array.isArray(rows) ? rows : single ? [root] : null
      if (!records) {
        invalidFiles++
        return
      }

      const { kind } = activity
      const fileId = `${kind}:${fingerprint(json)}`
      if (fileIds.has(fileId)) {
        duplicateFiles++
        return
      }
      fileIds.add(fileId)
      filesRead++
      coverage[kind] = true
      if (!records.length) emptyFiles++

      const viewing = kind === 'postsViewed' || kind === 'videosWatched'
      const creators = viewing ? seen : interacted
      const limit = Math.min(records.length, MAX_RECORDS - processedRecords)
      limitedRecords += records.length - limit
      processedRecords += limit
      for (let i = 0; i < limit; i++) {
        const { creator, time, id } = extract(records[i])
        if (!creator && time === null && !id) {
          skippedRecords++
          continue
        }
        if (id && time !== null) {
          const key = `${kind}:${id}:${time}`
          const priorFile = activityIds.get(key)
          if (priorFile !== undefined && priorFile !== filesRead) {
            duplicateRecords++
            continue
          }
          activityIds.set(key, filesRead)
        }

        counts[kind]++
        if (time !== null) {
          first = Math.min(first, time)
          last = Math.max(last, time)
        }
        if (creator) {
          creators.set(creator, (creators.get(creator) ?? 0) + 1)
          if (viewing) seenWithCreator++
          else interactedWithCreator++
        }
      }
    },

    summarize(): InstagramSummary {
      return {
        counts: { ...counts },
        coverage: { ...coverage },
        total: counts.postsViewed + counts.videosWatched + counts.likedPosts + counts.savedPosts,
        dateRange: Number.isFinite(first)
          ? { start: new Date(first).toISOString().slice(0, 10), end: new Date(last).toISOString().slice(0, 10) }
          : null,
        topSeen: topCreators(seen),
        topInteracted: topCreators(interacted),
        seenWithCreator,
        interactedWithCreator,
        uniqueSeenCreators: seen.size,
        uniqueInteractedCreators: interacted.size,
        filesRead,
        emptyFiles,
        invalidFiles,
        duplicateFiles,
        duplicateRecords,
        skippedRecords,
        limitedRecords,
      }
    },
  }
}
