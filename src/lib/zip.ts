import { zipSync } from 'fflate'
import type { GeneratedFile } from '@/types'

export async function zipFiles(files: { name: string; blob: Blob }[], zipName: string): Promise<GeneratedFile> {
  const entries: Record<string, Uint8Array> = {}
  for (const f of files) {
    entries[f.name] = new Uint8Array(await f.blob.arrayBuffer())
  }
  const zipped = zipSync(entries)
  return { name: zipName, mimeType: 'application/zip', data: new Blob([zipped], { type: 'application/zip' }) }
}
