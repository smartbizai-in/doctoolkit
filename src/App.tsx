import { Loader2 } from 'lucide-react'
import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { TabBar } from '@/components/layout/TabBar'
import { useAndroidBackButton } from '@/hooks/useAndroidBackButton'
import { applyTheme } from '@/lib/theme'
import Home from '@/pages/Home'
import { useSettingsStore } from '@/store/settingsStore'

// Home loads eagerly so the very first screen is instant. Everything else — and
// especially the tool pages, which each pull in a heavy library (pdf.js, docx,
// tesseract.js, html2canvas...) — is code-split so opening the app doesn't pay
// for every tool up front. This matters a lot on the budget Android hardware
// this app's audience actually carries.
const Scan = lazy(() => import('@/pages/Scan'))
const Generate = lazy(() => import('@/pages/Generate'))
const History = lazy(() => import('@/pages/History'))
const Settings = lazy(() => import('@/pages/Settings'))
const ImagesToPdf = lazy(() => import('@/pages/tools/ImagesToPdf'))
const PdfToImages = lazy(() => import('@/pages/tools/PdfToImages'))
const MergePdf = lazy(() => import('@/pages/tools/MergePdf'))
const OrganizePdf = lazy(() => import('@/pages/tools/OrganizePdf'))
const CompressPdf = lazy(() => import('@/pages/tools/CompressPdf'))
const PdfToWord = lazy(() => import('@/pages/tools/PdfToWord'))
const WordToPdf = lazy(() => import('@/pages/tools/WordToPdf'))
const CompressImage = lazy(() => import('@/pages/tools/CompressImage'))
const ConvertImage = lazy(() => import('@/pages/tools/ConvertImage'))
const Ocr = lazy(() => import('@/pages/tools/Ocr'))

function TabLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="pb-24">{children}</div>
      <TabBar />
    </>
  )
}

function RouteFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="size-6 animate-spin text-[var(--text-tertiary)]" />
    </div>
  )
}

export default function App() {
  const theme = useSettingsStore((s) => s.theme)

  useEffect(() => applyTheme(theme), [theme])
  useAndroidBackButton()

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<TabLayout><Home /></TabLayout>} />
          <Route path="/scan" element={<TabLayout><Scan /></TabLayout>} />
          <Route path="/generate" element={<TabLayout><Generate /></TabLayout>} />
          <Route path="/history" element={<TabLayout><History /></TabLayout>} />
          <Route path="/settings" element={<TabLayout><Settings /></TabLayout>} />

          <Route path="/tools/images-to-pdf" element={<ImagesToPdf />} />
          <Route path="/tools/pdf-to-images" element={<PdfToImages />} />
          <Route path="/tools/merge-pdf" element={<MergePdf />} />
          <Route path="/tools/organize-pdf" element={<OrganizePdf />} />
          <Route path="/tools/compress-pdf" element={<CompressPdf />} />
          <Route path="/tools/pdf-to-word" element={<PdfToWord />} />
          <Route path="/tools/word-to-pdf" element={<WordToPdf />} />
          <Route path="/tools/compress-image" element={<CompressImage />} />
          <Route path="/tools/convert-image" element={<ConvertImage />} />
          <Route path="/tools/ocr" element={<Ocr />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
