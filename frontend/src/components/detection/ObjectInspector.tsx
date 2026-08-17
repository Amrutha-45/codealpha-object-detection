/**
 * ObjectInspector.tsx
 * ===================
 * Right-side slide-in panel that opens when the user clicks a bounding box.
 * Displays detailed metadata for the selected detected object.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { X, Target, Hash, Gauge, Box, Clock, Palette, Maximize2 } from 'lucide-react'
import type { TrackedObject } from '../../types/detection'
import { CLASS_ICONS, getClassColor } from '../../types/detection'

interface ObjectInspectorProps {
  object: TrackedObject | null
  inferenceTimeMs?: number
  onClose: () => void
}

function Row({ icon, label, value, mono = false }: { icon: React.ReactNode; label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-800/60 last:border-0">
      <span className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
        <span className="text-slate-600">{icon}</span>
        {label}
      </span>
      <span className={`text-[12px] font-bold text-slate-100 ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  )
}

export default function ObjectInspector({ object, inferenceTimeMs, onClose }: ObjectInspectorProps) {
  if (!object) return null

  const colors = getClassColor(object.class_name)
  const icon = CLASS_ICONS[object.class_name] ?? '●'
  const bboxWidth = Math.round(object.bbox.x2 - object.bbox.x1)
  const bboxHeight = Math.round(object.bbox.y2 - object.bbox.y1)
  const confidencePct = Math.round(object.confidence * 100)

  return (
    <AnimatePresence>
      <motion.div
        key="inspector"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="absolute right-0 top-0 h-full w-72 z-40 flex flex-col"
        style={{ background: 'rgba(5, 10, 20, 0.95)', backdropFilter: 'blur(20px)' }}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-4 py-3 border-b ${colors.border} border-opacity-40`}
          style={{ borderBottomColor: colors.hex + '50' }}
        >
          <div className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-xl text-sm"
              style={{ background: colors.hex + '25', border: `1px solid ${colors.hex}50` }}
            >
              {icon}
            </span>
            <div>
              <p className="text-sm font-extrabold text-slate-100 capitalize">{object.class_name}</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Object Inspector</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:text-white hover:bg-slate-800/60 transition-colors"
            aria-label="Close inspector"
          >
            <X size={15} />
          </button>
        </div>

        {/* Confidence Bar */}
        <div className="px-4 py-4 border-b border-slate-800/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Confidence</span>
            <span className="font-mono text-lg font-extrabold" style={{ color: colors.hex }}>
              {confidencePct}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${confidencePct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${colors.hex}aa, ${colors.hex})` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-slate-600">0%</span>
            <span className="text-[9px] text-slate-600">100%</span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 px-4 py-2 overflow-y-auto">
          <Row
            icon={<Target size={12} />}
            label="Class Name"
            value={
              <span className="flex items-center gap-1">
                <span>{icon}</span>
                <span className="capitalize">{object.class_name}</span>
              </span>
            }
          />
          <Row
            icon={<Hash size={12} />}
            label="Track ID"
            value={
              <span className="font-mono text-cyan-400">
                {object.track_id !== -1 ? `#${object.track_id}` : 'N/A'}
              </span>
            }
            mono
          />
          <Row
            icon={<Gauge size={12} />}
            label="Confidence"
            value={`${confidencePct}%`}
            mono
          />
          <Row
            icon={<Box size={12} />}
            label="Bbox (x1, y1)"
            value={`${Math.round(object.bbox.x1)}, ${Math.round(object.bbox.y1)}`}
            mono
          />
          <Row
            icon={<Box size={12} />}
            label="Bbox (x2, y2)"
            value={`${Math.round(object.bbox.x2)}, ${Math.round(object.bbox.y2)}`}
            mono
          />
          <Row
            icon={<Maximize2 size={12} />}
            label="Bbox Size"
            value={`${bboxWidth} × ${bboxHeight} px`}
            mono
          />
          {inferenceTimeMs !== undefined && (
            <Row
              icon={<Clock size={12} />}
              label="Detection Time"
              value={`${inferenceTimeMs.toFixed(1)} ms`}
              mono
            />
          )}
          <Row
            icon={<Palette size={12} />}
            label="Class Color"
            value={
              <span className="flex items-center gap-2">
                <span
                  className="h-3.5 w-3.5 rounded-full border border-white/20 flex-shrink-0"
                  style={{ backgroundColor: colors.hex }}
                />
                <span className="font-mono text-[11px] uppercase">{colors.hex}</span>
              </span>
            }
          />
          <Row
            icon={<Target size={12} />}
            label="Category"
            value={
              <span className="rounded-full border border-slate-700/60 bg-slate-900 px-2 py-0.5 text-[10px] uppercase font-bold text-slate-400">
                {object.category}
              </span>
            }
          />
        </div>

        {/* Footer hint */}
        <div className="px-4 py-3 border-t border-slate-800/60">
          <p className="text-[10px] text-slate-600 text-center">
            Click any bounding box to inspect that object
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
