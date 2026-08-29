import { Share } from '@capacitor/share'
import { Check, Copy, ExternalLink, ImageIcon, RotateCcw, ScanLine, Share2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { RootHeader } from '@/components/layout/RootHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { usePickFiles } from '@/hooks/usePickFiles'
import { isNative } from '@/lib/platform'
import { interpretScan } from '@/lib/scanInterpret'
import { scanFromImageFile, scanWithNativeUi, startWebScan, type ScanOutcome } from '@/lib/scanner'

type Phase = 'idle' | 'scanning' | 'result' | 'error'

export default function Scan() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<ScanOutcome | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [setupProgress, setSetupProgress] = useState<number | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const stopWebScanRef = useRef<(() => Promise<void>) | null>(null)
  const { input: fileInput, pick: pickImage } = usePickFiles({ accept: 'image/*' })

  const stopWebScan = useCallback(async () => {
    if (stopWebScanRef.current) {
      await stopWebScanRef.current()
      stopWebScanRef.current = null
    }
  }, [])

  useEffect(() => () => void stopWebScan(), [stopWebScan])

  const handleStart = async () => {
    setError(null)
    setResult(null)
    setSetupProgress(null)
    setPhase('scanning')
    try {
      if (isNative()) {
        const outcome = await scanWithNativeUi((percent) => setSetupProgress(percent))
        if (outcome) {
          setResult(outcome)
          setPhase('result')
        } else {
          setPhase('idle')
        }
        return
      }
      if (!videoRef.current) return
      stopWebScanRef.current = await startWebScan(videoRef.current, (outcome) => {
        void stopWebScan()
        setResult(outcome)
        setPhase('result')
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the camera')
      setPhase('error')
    }
  }

  const handlePickImage = async () => {
    const [file] = await pickImage()
    if (!file) return
    setError(null)
    setPhase('scanning')
    try {
      const outcome = await scanFromImageFile(file)
      if (outcome) {
        setResult(outcome)
        setPhase('result')
      } else {
        setError('No QR code or barcode found in that image')
        setPhase('error')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that image')
      setPhase('error')
    }
  }

  const reset = async () => {
    await stopWebScan()
    setResult(null)
    setError(null)
    setPhase('idle')
  }

  const interpretation = result ? interpretScan(result.value) : null

  const handleCopy = async () => {
    if (!result) return
    await navigator.clipboard.writeText(result.value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleOpen = () => {
    if (!result) return
    window.location.href = result.value
  }

  const handleShare = async () => {
    if (!result) return
    try {
      await Share.share({ text: result.value })
    } catch {
      // dismissed
    }
  }

  return (
    <div>
      <RootHeader title="Scan" subtitle="QR codes and barcodes, no internet needed" />
      {fileInput}
      <div className="flex flex-col gap-4 px-4">
        {phase === 'scanning' && !isNative() && (
          <Card className="overflow-hidden !p-0">
            <video ref={videoRef} className="aspect-square w-full bg-black object-cover" playsInline muted />
          </Card>
        )}

        {phase !== 'result' && (
          <Card className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="relative flex size-20 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              <ScanLine className="size-9" strokeWidth={1.75} />
            </div>
            <div>
              <p className="font-medium">
                {setupProgress != null
                  ? 'Setting up the scanner…'
                  : phase === 'scanning'
                    ? 'Point your camera at a code'
                    : 'Ready to scan'}
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {setupProgress != null
                  ? 'One-time setup — this only happens the first time you scan'
                  : 'Works with QR codes, product barcodes, WiFi and UPI codes'}
              </p>
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div className="flex w-full flex-col gap-2">
              <Button size="lg" icon={<ScanLine className="size-4" />} onClick={handleStart} loading={phase === 'scanning' && isNative()}>
                {setupProgress != null ? `Setting up… ${setupProgress}%` : phase === 'scanning' ? 'Scanning…' : 'Start scanning'}
              </Button>
              <Button size="lg" variant="secondary" icon={<ImageIcon className="size-4" />} onClick={handlePickImage}>
                Scan from photo
              </Button>
            </div>
          </Card>
        )}

        {phase === 'result' && result && interpretation && (
          <Card className="flex flex-col gap-4">
            <div>
              <span className="inline-flex items-center rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
                {interpretation.label}
              </span>
              {interpretation.summary && <p className="mt-2 text-lg font-semibold">{interpretation.summary}</p>}
              <p className="mt-1 break-all text-sm text-[var(--text-secondary)]">{result.value}</p>
            </div>
            <div className="flex flex-col gap-2">
              {interpretation.actionable && (
                <Button size="lg" icon={<ExternalLink className="size-4" />} onClick={handleOpen}>
                  {interpretation.kind === 'upi' ? 'Pay with UPI app' : 'Open'}
                </Button>
              )}
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" icon={copied ? <Check className="size-4" /> : <Copy className="size-4" />} onClick={handleCopy}>
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button variant="secondary" className="flex-1" icon={<Share2 className="size-4" />} onClick={handleShare}>
                  Share
                </Button>
              </div>
              <Button variant="ghost" icon={<RotateCcw className="size-4" />} onClick={reset}>
                Scan another
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
