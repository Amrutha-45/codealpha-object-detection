/**
 * ImageUploadPanel.tsx
 * ====================
 * Premium image detection panel.
 *
 * Features:
 * - Direct "Run Image Inference" button always available to re-run on demand
 * - Automatic re-inference on scope mode / filter / confidence changes via useImageInference hook
 * - QuickFilter bar above image
 * - ActiveFilters chips with individual removal & reset
 * - Per-class colored bounding boxes (BoundingBoxOverlay)
 * - ObjectInspector (click any box)
 * - Loading blur + "Analyzing..." overlay during inference
 * - Canvas-based annotated image download (reflects current filter)
 * - Saves entry to Detection History on each successful inference
 */

import { useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UploadCloud,
  Download,
  ImageIcon,
  X,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  Play,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { ImageDetectionResponse, DetectionScopeMode, HistoryEntry, TrackedObject } from '../../types/detection'
import { useImageInference } from '../../hooks/useImageInference'
import Button from '../common/Button'
import BoundingBoxOverlay from './BoundingBoxOverlay'
import QuickFilter from './QuickFilter'
import ActiveFilters from './ActiveFilters'
import ObjectInspector from './ObjectInspector'

interface ImageUploadPanelProps {
  confidence: number
  classFilter: string[]
  scopeMode: DetectionScopeMode
  onClassFilterChange: (classes: string[]) => void
  onScopeModeChange?: (mode: DetectionScopeMode) => void
  onResult: (result: ImageDetectionResponse) => void
  onHistoryEntry?: (entry: HistoryEntry) => void
}

const ACCEPTED_TYPES = ['.jpg', '.jpeg', '.png']

export default function ImageUploadPanel({
  confidence,
  classFilter,
  scopeMode,
  onClassFilterChange,
  onScopeModeChange,
  onResult,
  onHistoryEntry,
}: ImageUploadPanelProps) {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [selectedObject, setSelectedObject] = useState<TrackedObject | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Hook handles auto-inference + exposes runInference for manual clicks
  const {
    rawResult,
    filteredObjects,
    isInferring,
    isError,
    errorMessage,
    resetResult,
    runInference,
    retryFn,
    cancelFn,
  } = useImageInference({
    file,
    selectedClasses: classFilter,
    confidence,
    scopeMode,
    enabled: hasAnalyzed,
    onResult: (res) => {
      onResult(res)
      // Save to detection history
      if (previewUrl) {
        const entry: HistoryEntry = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          imageDataUrl: previewUrl,
          annotatedImageUrl: res.annotated_image_url,
          cleanImageUrl: res.clean_image_url,
          objects: res.result.objects,
          totalDetected: res.result.objects.length,
          inferenceTimeMs: res.result.inference_time_ms,
          scopeMode,
          filtersUsed: scopeMode === 'detect-selected' ? [...classFilter] : [],
        }
        onHistoryEntry?.(entry)
      }
    },
  })

  const validateAndSetFile = (candidate: File) => {
    const ext = candidate.name.slice(candidate.name.lastIndexOf('.')).toLowerCase()
    if (!ACCEPTED_TYPES.includes(ext)) {
      toast.error(`Unsupported file type. Allowed: ${ACCEPTED_TYPES.join(', ')}`)
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(candidate)
    setPreviewUrl(URL.createObjectURL(candidate))
    setHasAnalyzed(false)
    resetResult()
    setSelectedObject(null)
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) validateAndSetFile(dropped)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewUrl])

  // First-time or manual analysis button click
  const handleTriggerAnalysis = () => {
    if (!hasAnalyzed) {
      setHasAnalyzed(true)
    } else {
      runInference()
    }
  }

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    setHasAnalyzed(false)
    resetResult()
    setSelectedObject(null)
  }

  // Canvas-based export — renders current filtered boxes onto a canvas and downloads
  const handleDownloadAnnotated = () => {
    if (!previewUrl || !rawResult) return

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0)

      // Draw each filtered bounding box
      filteredObjects.forEach((obj) => {
        const { x1, y1, x2, y2 } = obj.bbox
        const w = x2 - x1
        const h = y2 - y1

        // Box outline
        ctx.strokeStyle = '#22d3ee'
        ctx.lineWidth = 3
        ctx.strokeRect(x1, y1, w, h)

        // Label background
        const label = `${obj.class_name} ${Math.round(obj.confidence * 100)}%`
        ctx.font = 'bold 15px Inter, sans-serif'
        const tw = ctx.measureText(label).width
        ctx.fillStyle = 'rgba(34, 211, 238, 0.9)'
        ctx.fillRect(x1, y1 - 24, tw + 12, 22)

        // Label text
        ctx.fillStyle = '#0f172a'
        ctx.fillText(label, x1 + 6, y1 - 7)
      })

      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `visiontrack_${Date.now()}.png`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Annotated image downloaded!')
      }, 'image/png')
    }
    img.src = previewUrl
  }

  const showResult = hasAnalyzed && !!previewUrl

  return (
    <div className="card-glass flex flex-col overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4">
        <div className="flex items-center gap-2">
          <ImageIcon size={18} className="text-cyan-400" />
          <p className="font-bold text-slate-100">Image Detection Engine</p>
        </div>
        <div className="flex items-center gap-2">
          {rawResult && (
            <motion.span
              key={filteredObjects.length}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-pill border-cyan-500/30 text-cyan-300 shadow-glow font-mono font-bold text-[11px]"
            >
              {filteredObjects.length} object{filteredObjects.length !== 1 ? 's' : ''} detected
            </motion.span>
          )}
          {isInferring && (
            <span className="text-[11px] font-semibold text-amber-400 animate-pulse flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Running Inference...
            </span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* ── UPLOAD DROP ZONE (no file yet) ── */}
        {!file && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-all duration-300 ${
              isDragging
                ? 'border-cyan-400 bg-cyan-500/10 shadow-glow'
                : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 shadow-xl text-cyan-400">
              <UploadCloud size={32} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">Drag & drop an image, or click to browse</p>
              <p className="mt-1 text-xs text-slate-500">Supports JPG, JPEG, PNG (Up to 200 MB)</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              className="hidden"
              onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
            />
          </div>
        )}

        {/* ── FILE LOADED, NOT YET ANALYZED ── */}
        {file && !hasAnalyzed && (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-black">
              {previewUrl && (
                <img src={previewUrl} alt="Preview" className="max-h-96 w-full object-contain mx-auto" />
              )}
              <button
                onClick={reset}
                className="absolute right-3 top-3 rounded-full bg-slate-950/80 p-2 text-slate-300 hover:text-white transition-colors"
                title="Remove image"
              >
                <X size={16} />
              </button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <Button
                variant="primary"
                icon={<Sparkles size={16} />}
                onClick={handleTriggerAnalysis}
                className="w-full py-3.5 text-base font-bold shadow-lg shadow-cyan-500/20"
              >
                Run Image Inference
              </Button>
              <p className="text-center text-[11px] text-slate-500">
                You can select target class filters on the right or quick bar before or after running inference
              </p>
            </motion.div>
          </div>
        )}

        {/* ── RESULT VIEW ── */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Error Banner with Retry and Cancel */}
              {isError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-rose-500/40 bg-rose-950/90 p-4 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl"
                >
                  <div className="flex items-center gap-2.5 text-rose-200 text-xs font-medium">
                    <AlertTriangle size={18} className="text-rose-400 flex-shrink-0" />
                    <span>{errorMessage || 'Inference failed. Check backend connection.'}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={retryFn}
                      className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition-colors shadow-md"
                    >
                      <RotateCcw size={13} />
                      Retry
                    </button>
                    <button
                      onClick={cancelFn}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <X size={13} />
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Quick Filter bar above image */}
              <QuickFilter
                selectedClasses={classFilter}
                scopeMode={scopeMode}
                onChange={onClassFilterChange}
                onScopeModeChange={onScopeModeChange}
                disabled={isInferring}
              />

              {/* Active Filters chips */}
              <ActiveFilters
                selectedClasses={classFilter}
                scopeMode={scopeMode}
                onChange={onClassFilterChange}
                onScopeModeChange={onScopeModeChange}
                disabled={isInferring}
              />

              {/* Bounding Box Image (with ObjectInspector overlay) */}
              <div className="relative">
                <BoundingBoxOverlay
                  imageSrc={previewUrl!}
                  objects={filteredObjects}
                  isInferring={isInferring}
                  onObjectClick={setSelectedObject}
                  selectedObjectId={selectedObject?.track_id ?? null}
                />

                {/* Object Inspector (absolute positioned inside the image container) */}
                <AnimatePresence>
                  {selectedObject && (
                    <ObjectInspector
                      object={selectedObject}
                      inferenceTimeMs={rawResult?.result.inference_time_ms}
                      onClose={() => setSelectedObject(null)}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {/* Re-run inference button */}
                <Button
                  variant="primary"
                  icon={<Play size={15} className="fill-current" />}
                  onClick={handleTriggerAnalysis}
                  disabled={isInferring}
                  className="flex-1 min-w-[180px] py-2.5 shadow-md"
                >
                  {isInferring ? 'Processing...' : 'Run Image Inference'}
                </Button>

                {/* Download */}
                <button
                  onClick={handleDownloadAnnotated}
                  disabled={isInferring || !previewUrl}
                  className="btn-secondary flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold disabled:opacity-40"
                  title="Download annotated image with current filters"
                >
                  <Download size={15} />
                  Download PNG
                </button>

                {/* New Image */}
                <Button
                  variant="secondary"
                  icon={<RefreshCw size={15} />}
                  onClick={reset}
                  className="py-2.5 px-4 text-xs"
                >
                  New Image
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

