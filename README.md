# DocToolkit

An offline-first document toolkit for Android: PDF and Word conversion, image tools, and a
QR/barcode scanner + generator. React + Vite + TypeScript, wrapped for Android with Capacitor.

**Everything runs on-device.** There is no backend and no network call anywhere in the app —
conversions, OCR, and QR/barcode scanning all happen locally, which is also why the OCR engine
(Tesseract.js core + English trained data) is bundled into `public/tesseract/` instead of fetched
from a CDN at runtime.

## What's in the box

- **PDF**: images↔PDF, merge, organize (reorder/rotate/delete pages), compress, PDF→Word,
  Word→PDF
- **Image**: compress, convert (JPG/PNG/WebP)
- **OCR**: photo or scan → editable text, fully on-device
- **Scan**: QR codes and barcodes via the camera (Google ML Kit) or from a gallery photo
- **Create**: QR codes (text, URL, WiFi, UPI payment, contact card, email, SMS, phone) and
  barcodes (CODE128, EAN-13/8, UPC, CODE39, ITF-14)
- **History**: local-only record of past conversions, with re-share
- Light/dark/system theme, Android hardware back-button handling

## Stack

React 19 + Vite + TypeScript + Tailwind CSS v4 + Zustand, Capacitor 8 for the Android shell.
Money/PDF-adjacent libraries: `pdf-lib`, `pdfjs-dist`, `docx`, `mammoth`, `html2canvas` + `jspdf`,
`tesseract.js`, `qrcode`, `jsbarcode`, `@capacitor-mlkit/barcode-scanning`.

## Getting started

```bash
npm install
npm run dev          # vite dev server
npm run typecheck    # tsc -b — the source of truth for type errors
npm run build         # tsc -b && vite build
npm run lint          # oxlint
```

## Android

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug     # or open android/ in Android Studio
```

The Android project lives in `android/` (added via `npx cap add android`, not hand-written).
`resources/logo.svg` is the source for app icons and splash screens — regenerate them after
changing it with:

```bash
npx capacitor-assets generate --android \
  --iconBackgroundColor '#4f46e5' --iconBackgroundColorDark '#312e81' \
  --splashBackgroundColor '#0f172a' --splashBackgroundColorDark '#0f172a'
```

App ID is `com.smartbizai.doctoolkit` (set in `capacitor.config.ts` and mirrored into
`android/app/build.gradle` — Capacitor doesn't keep these in sync automatically, so if one
changes, update the other by hand).

### Before a Play Store release

- Generate a real upload keystore and configure signing in `android/app/build.gradle` — the debug
  build here is unsigned/debug-signed only.
- Bump `versionCode`/`versionName` in `android/app/build.gradle` per release.
- `minSdkVersion` is 24 (Android 7.0+). The QR/barcode scanner needs Google Play Services on the
  device (standard on any Play Store phone) to download ML Kit's scanning module the first time
  it's used — this download is one-time and silent on a real device, but won't succeed on an
  emulator image without full Play Store support (a "Google APIs" image, as opposed to a "Google
  Play" image, will show a "could not set up the scanner" error — expected, not a bug).

## Project layout

```
src/lib/           conversion logic — pdf/, ocr.ts, image.ts, qr.ts, barcode.ts, scanner.ts
src/pages/tools/    one screen per tool, all following pick → configure → run → ResultPanel
src/components/     shared UI (Dropzone, ResultPanel, ToolHeader, ui/*)
src/store/          zustand stores (history, settings), persisted via @capacitor/preferences
public/tesseract/   bundled OCR runtime (WASM core, worker script, eng.traineddata)
```

## Known trade-offs

- **PDF→Word** extracts real text directly when present; scanned pages fall back to on-device
  OCR automatically. Complex layouts, tables, and images aren't reproduced — this optimizes for
  getting editable text out, not layout fidelity.
- **Word→PDF** rasterizes the rendered document into the PDF (via html2canvas), so the result
  looks right but its text isn't selectable.
- **Compress PDF** re-rasterizes every page, which is a big win for scanned/photo-heavy PDFs and
  a poor trade for already-small text-only PDFs.
