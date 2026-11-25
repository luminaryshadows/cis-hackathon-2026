/// <reference types="vite/client" />
import type {InstagramSummary} from './instagram'
import InstagramImportWorker from './instagramImport.worker?worker&inline'
import type {ImportFile, ImportResult} from './instagramImport.worker'

export async function analyzeInstagramFilesInWorker(
  files: readonly File[],
  signal: AbortSignal,
): Promise<InstagramSummary> {
  signal.throwIfAborted()
  const worker = new InstagramImportWorker()
  let abort: (() => void) | undefined
  try {
    return await new Promise<InstagramSummary>((resolve, reject) => {
      abort = () => reject(signal.reason)
      signal.addEventListener('abort', abort, {once: true})
      worker.onmessage = ({data}: MessageEvent<ImportResult>) => {
        if ('error' in data) reject(new Error(data.error))
        else resolve(data.summary)
      }
      worker.onerror = worker.onmessageerror = () => reject(new Error('The export could not be read.'))
      const input: ImportFile[] = files.map(file => ({file, relativePath: file.webkitRelativePath}))
      worker.postMessage(input)
    })
  } finally {
    if (abort) signal.removeEventListener('abort', abort)
    worker.terminate()
  }
}
