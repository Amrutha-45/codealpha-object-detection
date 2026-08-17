/**
 * BoundingBoxOverlay.tsx
 * ======================
 * Renders client-side bounding boxes over the clean (unannotated) image.
 * Each class has its own distinct color. Boxes are clickable to open ObjectInspector.
 * Shows a loading blur + spinner overlay during inference.
 */

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import type { TrackedObject } from '../../types/detection'
import { CLASS_ICONS, getClassColor } from '../../types/detection'

interface BoundingBoxOverlayProps {
  imageSrc: string         // clean (raw) image URL
  objects: TrackedObject[]
  isInferring?: boolean    // show blur + spinner when true
  onObjectClick?: (obj: TrackedObject) => void
  selectedObjectId?: number | null
}

export default function BoundingBoxOverlay({
  imageSrc,
  objects,
  isInferring,
  onObjectClick,
  selectedObjectId,
}: BoundingBoxOverlayProps) {
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number } | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget
    if (naturalWidth && naturalHeight) {
      setNaturalDimensions({ width: naturalWidth, height: naturalHeight })
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-black shadow-2xl flex items-center justify-center">
      <div className="relative inline-block max-w-full">

        {/* Main Image */}
        <img
          ref={imgRef}
          src={imageSrc}
          alt="Detection frame"
          onLoad={handleImageLoad}
          className={`max-h-[540px] w-auto h-auto block object-contain mx-auto transition-all duration-500 ${isInferring ? 'blur-sm brightness-50 scale-[1.01]' : ''}`}
        />

        {/* Loading overlay — shown while inferring */}
        <AnimatePresence>
          {isInferring && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-50"
            >
              <div className="flex items-center gap-3 rounded-2xl border border-cyan-500/30 bg-slate-950/80 backdrop-blur-md px-6 py-4 shadow-xl">
                <Loader2 size={20} className="text-cyan-400 animate-spin" />
                <span className="text-sm font-bold text-slate-200 tracking-wide">Updating Detection...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bounding Box Overlay Layer */}
        {naturalDimensions && !isInferring && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <AnimatePresence>
              {objects.map((obj, idx) => {
                const colors = getClassColor(obj.class_name)
                const icon = CLASS_ICONS[obj.class_name] ?? '●'
                const left   = (obj.bbox.x1 / naturalDimensions.width) * 100
                const top    = (obj.bbox.y1 / naturalDimensions.height) * 100
                const width  = ((obj.bbox.x2 - obj.bbox.x1) / naturalDimensions.width) * 100
                const height = ((obj.bbox.y2 - obj.bbox.y1) / naturalDimensions.height) * 100
                const isSelected = selectedObjectId !== null && selectedObjectId === obj.track_id

                return (
                  <motion.div
                    key={`${obj.class_name}-${obj.track_id}-${idx}-${obj.bbox.x1.toFixed(0)}`}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.22, ease: 'easeOut', delay: idx * 0.02 }}
                    onClick={(e) => { e.stopPropagation(); onObjectClick?.(obj) }}
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                      width: `${width}%`,
                      height: `${height}%`,
                      borderColor: colors.hex,
                      backgroundColor: colors.hex + (isSelected ? '30' : '18'),
                      boxShadow: isSelected ? `0 0 0 2px ${colors.hex}, 0 0 16px ${colors.hex}50` : `0 0 8px ${colors.hex}30`,
                    }}
                    className={`absolute border-2 rounded-md pointer-events-auto cursor-pointer transition-all duration-150`}
                  >
                    {/* Label */}
                    <div
                      className="absolute -top-6 left-0 z-20 flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide shadow-md whitespace-nowrap"
                      style={{ backgroundColor: colors.hex }}
                    >
                      <span className="text-slate-950">{icon}</span>
                      <span className="text-slate-950">{obj.class_name}</span>
                      {obj.track_id !== -1 && (
                        <span className="text-slate-950 opacity-70">#{obj.track_id}</span>
                      )}
                      <span className="ml-1 bg-black/30 text-white rounded px-1">
                        {Math.round(obj.confidence * 100)}%
                      </span>
                    </div>

                    {/* Corner dots for selected state */}
                    {isSelected && (
                      <>
                        <span className="absolute -top-1 -left-1 h-2 w-2 rounded-full border border-white" style={{ backgroundColor: colors.hex }} />
                        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full border border-white" style={{ backgroundColor: colors.hex }} />
                        <span className="absolute -bottom-1 -left-1 h-2 w-2 rounded-full border border-white" style={{ backgroundColor: colors.hex }} />
                        <span className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full border border-white" style={{ backgroundColor: colors.hex }} />
                      </>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Top-right object count badge */}
      {objects.length > 0 && !isInferring && (
        <div className="absolute top-3 right-3 flex flex-wrap gap-1.5 z-30 max-w-xs pointer-events-none">
          <span className="glass-pill border-cyan-500/40 bg-slate-950/80 text-cyan-300 shadow-glow font-mono font-bold">
            {objects.length} Detected
          </span>
        </div>
      )}
    </div>
  )
}
