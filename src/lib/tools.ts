import type { ToolDefinition } from '@/types'

export const TOOLS: ToolDefinition[] = [
  {
    id: 'images-to-pdf',
    title: 'Images to PDF',
    description: 'Combine photos or images into one PDF',
    category: 'pdf',
    path: '/tools/images-to-pdf',
    accent: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
  },
  {
    id: 'pdf-to-images',
    title: 'PDF to Images',
    description: 'Export every page as a JPG',
    category: 'pdf',
    path: '/tools/pdf-to-images',
    accent: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  },
  {
    id: 'merge-pdf',
    title: 'Merge PDFs',
    description: 'Combine multiple PDFs into one',
    category: 'pdf',
    path: '/tools/merge-pdf',
    accent: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400',
  },
  {
    id: 'organize-pdf',
    title: 'Organize Pages',
    description: 'Reorder, rotate or delete pages',
    category: 'pdf',
    path: '/tools/organize-pdf',
    accent: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
  },
  {
    id: 'compress-pdf',
    title: 'Compress PDF',
    description: 'Shrink file size for sharing',
    category: 'pdf',
    path: '/tools/compress-pdf',
    accent: 'bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400',
  },
  {
    id: 'pdf-to-word',
    title: 'PDF to Word',
    description: 'Get an editable .docx from a PDF',
    category: 'pdf',
    path: '/tools/pdf-to-word',
    accent: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  },
  {
    id: 'word-to-pdf',
    title: 'Word to PDF',
    description: 'Turn a .docx into a shareable PDF',
    category: 'pdf',
    path: '/tools/word-to-pdf',
    accent: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
  },
  {
    id: 'compress-image',
    title: 'Compress Image',
    description: 'Shrink photos without losing much quality',
    category: 'image',
    path: '/tools/compress-image',
    accent: 'bg-lime-100 text-lime-700 dark:bg-lime-500/15 dark:text-lime-400',
  },
  {
    id: 'convert-image',
    title: 'Convert Image',
    description: 'Switch between JPG, PNG and WebP',
    category: 'image',
    path: '/tools/convert-image',
    accent: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400',
  },
  {
    id: 'ocr',
    title: 'Extract Text (OCR)',
    description: 'Turn a photo or scan into editable text',
    category: 'image',
    path: '/tools/ocr',
    accent: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-500/15 dark:text-fuchsia-400',
  },
  {
    id: 'scan',
    title: 'Scan QR / Barcode',
    description: 'Use the camera to read any code',
    category: 'code',
    path: '/scan',
    accent: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400',
  },
  {
    id: 'generate',
    title: 'Create QR / Barcode',
    description: 'UPI, WiFi, contact card and more',
    category: 'code',
    path: '/generate',
    accent: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  },
]

export const CATEGORY_LABEL: Record<ToolDefinition['category'], string> = {
  pdf: 'PDF',
  image: 'Image',
  code: 'QR & Barcode',
}

export function getTool(id: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.id === id)
}
