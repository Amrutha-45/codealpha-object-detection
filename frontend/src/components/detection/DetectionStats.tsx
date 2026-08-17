/**
 * DetectionStats.tsx
 * ==================
 * Live detection statistics panel with per-class bar chart.
 * Updates automatically after every inference. Always matches the current filter.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, Layers } from 'lucide-react'
import type { TrackedObject, DetectionScopeMode } from '../../types/detection'
import { CLASS_ICONS, getClassColor } from '../../types/detection'

interface DetectionStatsProps {
  objects: TrackedObject[]
  scopeMode: DetectionScopeMode
  selectedClasses: string[]
  inferenceTimeMs?: number
  isInferring?: boolean
}

interface ClassCount {
  name: string
  count: number
}

export default function DetectionStats({
  objects,
  scopeMode,
  selectedClasses,
  inferenceTimeMs,
  isInferring,
}: DetectionStatsProps) {
  // Compute per-class counts
  const classCounts: ClassCount[] = []
  const countMap: Record<string, number> = {}

  for (const obj of objects) {
    countMap[obj.class_name] = (countMap[obj.class_name] ?? 0) + 1
  }

  for (const [name, count] of Object.entries(countMap)) {
    classCounts.push({ name, count })
  }
  classCounts.sort((a, b) => b.count - a.count)

  const maxCount = classCounts.length > 0 ? classCounts[0].count : 1

  // Summary counts
  const personCount = objects.filter((o) => o.category === 'person').length
  const vehicleCount = objects.filter((o) => o.category === 'vehicle').length
  const animalCount = objects.filter((o) => o.category === 'animal').length

  const modeLabel = scopeMode === 'detect-all'
    ? '🟢 Detect All'
    : `🎯 ${selectedClasses.length > 0 ? selectedClasses.slice(0, 3).map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(' + ') : 'None selected'}`

  return (
    <div className="card-glass p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="section-title flex items-center gap-2">
          <BarChart3 size={13} className="text-cyan-400" />
          Live Detection Stats
        </p>
        <span className="glass-pill text-[10px] font-bold">{modeLabel}</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Objects', value: objects.length, color: '#22d3ee' },
          { label: 'Persons',  value: personCount,   color: '#60a5fa' },
          { label: 'Vehicles', value: vehicleCount,  color: '#4ade80' },
          { label: 'Animals',  value: animalCount,   color: '#c084fc' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 text-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={stat.value}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-extrabold font-mono"
                style={{ color: stat.color }}
              >
                {isInferring ? (
                  <span className="animate-pulse text-slate-600">—</span>
                ) : (
                  stat.value
                )}
              </motion.p>
            </AnimatePresence>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Per-class bar chart */}
      {classCounts.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Layers size={10} />
            Per-Class Breakdown
          </p>
          <AnimatePresence>
            {classCounts.map(({ name, count }) => {
              const colors = getClassColor(name)
              const icon = CLASS_ICONS[name] ?? '●'
              const pct = (count / maxCount) * 100
              return (
                <motion.div
                  key={name}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-2.5"
                >
                  <span className="w-5 flex-shrink-0 text-center text-sm">{icon}</span>
                  <span className="w-14 flex-shrink-0 text-[11px] font-semibold text-slate-300 capitalize truncate">{name}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: colors.hex }}
                    />
                  </div>
                  <span
                    className="w-6 flex-shrink-0 text-right font-mono text-[11px] font-bold"
                    style={{ color: colors.hex }}
                  >
                    {count}
                  </span>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Empty state */}
      {classCounts.length === 0 && !isInferring && (
        <p className="text-center text-[11px] text-slate-600 py-2">
          Run inference to see detection statistics
        </p>
      )}

      {/* Inference time footer */}
      {inferenceTimeMs !== undefined && (
        <div className="flex items-center justify-between border-t border-slate-800/40 pt-3">
          <span className="text-[10px] font-semibold text-slate-500">Inference Latency</span>
          <span className="font-mono text-[11px] font-bold text-cyan-400">{inferenceTimeMs.toFixed(1)} ms</span>
        </div>
      )}
    </div>
  )
}
