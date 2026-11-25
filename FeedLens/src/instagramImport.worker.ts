import type {InstagramSummary} from './instagram'
import {analyzeInstagramFiles} from './instagramImport'

export type ImportFile = {file: File; relativePath: string}
export type ImportResult = {summary: InstagramSummary} | {error: string}

self.onmessage = async ({data}: MessageEvent<ImportFile[]>) => {
  let result: ImportResult
  try {
    const files = data.map(({file, relativePath}) => {
      // Structured cloning File does not preserve webkitRelativePath.
      if (relativePath) Object.defineProperty(file, 'webkitRelativePath', {value: relativePath})
      return file
    })
    result = {summary: await analyzeInstagramFiles(files)}
  } catch (error) {
    result = {error: error instanceof Error ? error.message : 'The export could not be read.'}
  }
  self.postMessage(result)
}
