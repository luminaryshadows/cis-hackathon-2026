import { BlobReader, ZipReader } from '@zip.js/zip.js/lib/zip-core-native.js'
import { createInstagramAnalyzer, matchInstagramFile, type InstagramSummary } from './instagram.ts'

const MiB = 1024 * 1024
const maxActivityFileBytes = 16 * MiB
const maxActivityBytes = 64 * MiB
const maxActivityFiles = 256
const maxArchiveBytes = 4 * 1024 * MiB
const maxEntries = 25_000

class InstagramImportError extends Error {}

class BoundedZipReader extends BlobReader {
  readUint8Array(offset: number, length: number) {
    // ZIP metadata can declare a massive central directory before any entries are yielded.
    if (length > maxActivityFileBytes) {
      throw new InstagramImportError('The ZIP directory is too large. Select the extracted activity JSON files instead.')
    }
    return super.readUint8Array(offset, length)
  }
}

export async function analyzeInstagramFiles(
  files: readonly File[],
  signal?: AbortSignal,
): Promise<InstagramSummary> {
  signal?.throwIfAborted()
  if (!files.length) throw new Error('Choose an Instagram ZIP export or activity JSON files.')
  if (files.length > maxEntries) {
    throw new Error('Too many files selected. Choose only the Instagram ZIP export or activity JSON files.')
  }

  const analyzer = createInstagramAnalyzer()
  let activityFiles = 0
  let activityBytes = 0
  let archiveBytes = 0
  let entries = 0
  let hasHtml = false

  function countActivityFile(bytes: number) {
    if (activityFiles >= maxActivityFiles) {
      throw new InstagramImportError('The selection contains more than 256 supported activity files. Try a shorter export date range.')
    }
    if (!Number.isSafeInteger(bytes) || bytes < 0 || bytes > maxActivityFileBytes) {
      throw new InstagramImportError('An activity JSON file exceeds 16 MB. Try a shorter export date range.')
    }
    if (activityBytes + bytes > maxActivityBytes) {
      throw new InstagramImportError('The activity files exceed 64 MB total. Try a shorter export date range.')
    }
    activityFiles++
    activityBytes += bytes
  }

  for (const file of files) {
    signal?.throwIfAborted()
    const path = file.webkitRelativePath || file.name

    if (/\.zip$/i.test(path)) {
      archiveBytes += file.size
      if (archiveBytes > maxArchiveBytes) {
        throw new InstagramImportError('The ZIP selection exceeds 4 GB. Choose a smaller export or select the extracted activity JSON files.')
      }
      const archive = new ZipReader(new BoundedZipReader(file), { useWebWorkers: false })
      try {
        for await (const entry of archive.getEntriesGenerator()) {
          signal?.throwIfAborted()
          if (++entries > maxEntries) {
            throw new InstagramImportError('The ZIP selection contains too many entries. Select the extracted activity JSON files instead.')
          }
          if (entry.directory) continue
          if (/\.html?$/i.test(entry.filename)) hasHtml = true
          if (!matchInstagramFile(entry.filename)) continue
          if (entry.encrypted) throw new InstagramImportError('The Instagram ZIP is password-protected. Select the extracted activity JSON files instead.')
          if (entry.compressedSize > 32 * MiB) {
            throw new InstagramImportError('An activity entry is too large to extract. Try a shorter export date range.')
          }
          const remainingByteBudget = Math.min(maxActivityFileBytes, maxActivityBytes - activityBytes)
          countActivityFile(entry.uncompressedSize)

          const decoder = new TextDecoder()
          let text = ''
          let extractedBytes = 0
          const output = new WritableStream<Uint8Array>({
            write(chunk) {
              extractedBytes += chunk.byteLength
              if (extractedBytes > remainingByteBudget) {
                throw new InstagramImportError('An extracted activity file exceeds the remaining size limit. Try a shorter export date range.')
              }
              text += decoder.decode(chunk, { stream: true })
            },
          })
          await entry.getData(output, { checkCrc32: true, signal })
          signal?.throwIfAborted()
          analyzer.addFile(entry.filename, text + decoder.decode())
        }
      } catch (error) {
        signal?.throwIfAborted()
        if (error instanceof InstagramImportError) throw error
        throw new Error('The Instagram ZIP could not be read. Try downloading it again or selecting the extracted activity JSON files.')
      } finally {
        await archive.close()
      }
    } else if (matchInstagramFile(path)) {
      countActivityFile(file.size)
      const text = await file.text().catch(() => {
        signal?.throwIfAborted()
        throw new Error('An activity JSON file could not be read. Select it again or download a new export.')
      })
      signal?.throwIfAborted()
      analyzer.addFile(path, text)
    } else if (/\.html?$/i.test(path)) {
      hasHtml = true
    }
  }

  signal?.throwIfAborted()
  if (!activityFiles) {
    if (hasHtml) throw new Error('This selection contains HTML. Request the Instagram export in JSON format.')
    throw new Error('No supported Instagram activity JSON files were found in this selection.')
  }
  return analyzer.summarize()
}
