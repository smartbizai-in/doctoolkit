import { useRef } from 'react'

/** Cross-platform file picking via a hidden <input type="file">. On Android,
 *  Capacitor's WebView bridges this to the native system file/photo chooser
 *  automatically — no extra plugin needed. */
export function usePickFiles(opts: { accept: string; multiple?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const resolverRef = useRef<((files: File[]) => void) | null>(null)

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept={opts.accept}
      multiple={opts.multiple}
      className="hidden"
      onChange={(e) => {
        const files = Array.from(e.target.files ?? [])
        resolverRef.current?.(files)
        resolverRef.current = null
        e.target.value = ''
      }}
    />
  )

  const pick = () =>
    new Promise<File[]>((resolve) => {
      resolverRef.current = resolve
      inputRef.current?.click()
    })

  return { input, pick }
}
