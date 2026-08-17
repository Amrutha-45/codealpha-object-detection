/**
 * DetectionHistory.tsx
 * ====================
 * Full-page detection history with session cards, thumbnails, export options.
 * Persists to localStorage so history survives page refreshes.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  History,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  SlidersHorizontal,
  FileText,
  FileSpreadsheet,
  ImageIcon,
  Search,
  X,
} from 'lucide-react'
import type { HistoryEntry } from '../../types/detection'
import { CLASS_ICONS, getClassColor } from '../../types/detection'
import { getDownloadUrl } from '../../api/client'

interface DetectionHistoryProps {
  entries: HistoryEntry[]
  onClearAll: () => void
}

export default function DetectionHistory({ entries, onClearAll }: DetectionHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [modeFilter, setModeFilter] = useState<'all' | 'detect-all' | 'detect-selected'>('all')

  const filteredEntries = entries.filter((e) => {
    const matchesSearch =
      searchTerm === '' ||
      e.filtersUsed.some((f) => f.toLowerCase().includes(searchTerm.toLowerCase())) ||
      String(e.totalDetected).includes(searchTerm)
    const matchesMode = modeFilter === 'all' || e.scopeMode === modeFilter
    return matchesSearch && matchesMode
  })

  const exportCSV = (entry: HistoryEntry) => {
    const rows = [
      ['track_id', 'class_name', 'category', 'confidence', 'x1', 'y1', 'x2', 'y2'],
      ...entry.objects.map((o) => [
        o.track_id,
        o.class_name,
        o.category,
        o.confidence.toFixed(3),
        o.bbox.x1.toFixed(0),
        o.bbox.y1.toFixed(0),
        o.bbox.x2.toFixed(0),
        o.bbox.y2.toFixed(0),
      ]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `detection_${entry.id.slice(0, 8)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportJSON = (entry: HistoryEntry) => {
    const blob = new Blob([JSON.stringify(entry, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `detection_${entry.id.slice(0, 8)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadAnnotatedImage = (entry: HistoryEntry) => {
    if (!entry.annotatedImageUrl) return
    const url = getDownloadUrl(entry.annotatedImageUrl)
    const a = document.createElement('a')
    a.href = url
    a.download = `annotated_${entry.id.slice(0, 8)}.jpg`
    a.click()
  }

  const formatTime = (epoch: number) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      month: 'short',
      day: 'numeric',
    }).format(new Date(epoch))
  }

  return (
    <div className="card-glass p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-5">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <History size={18} className="text-cyan-400" />
            Detection History
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {entries.length} session{entries.length !== 1 ? 's' : ''} saved • Persists across page reloads
          </p>
        </div>
        {entries.length > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 rounded-xl border border-rose-800/50 bg-rose-950/30 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-900/30 hover:text-rose-300 transition-colors"
          >
            <Trash2 size={13} />
            Clear History
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by class, object count..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-slate-500 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-1.5">
          {(['all', 'detect-all', 'detect-selected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setModeFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                modeFilter === f
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'bg-slate-900/60 text-slate-500 border border-slate-800 hover:text-slate-300'
              }`}
            >
              {f === 'all' ? 'All' : f === 'detect-all' ? '🟢 All' : '🎯 Selected'}
            </button>
          ))}
        </div>
      </div>

      {/* Entry list */}
      {filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-center justify-center mb-4 text-slate-700">
            <History size={32} strokeWidth={1.5} />
          </div>
          <p className="text-sm font-semibold text-slate-400">No detection history yet</p>
          <p className="text-xs text-slate-600 mt-1">
            {entries.length === 0
              ? 'Run image detection to save sessions here.'
              : 'No sessions match your filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredEntries.map((entry, idx) => {
              const isExpanded = expandedId === entry.id
              // Deduplicate class names for display
              const uniqueClasses = [...new Set(entry.objects.map((o) => o.class_name))]

              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  className="rounded-2xl border border-slate-800/80 bg-slate-950/40 overflow-hidden"
                >
                  {/* Card Header — always visible */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-900/40 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  >
                    {/* Thumbnail */}
                    <div className="h-14 w-20 flex-shrink-0 rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
                      <img
                        src={entry.imageDataUrl}
                        alt="Detection thumbnail"
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
                          entry.scopeMode === 'detect-all'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                        }`}>
                          {entry.scopeMode === 'detect-all' ? '🟢 Detect All' : '🎯 Selected'}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">{entry.inferenceTimeMs.toFixed(0)}ms</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-200">
                        {entry.totalDetected} object{entry.totalDetected !== 1 ? 's' : ''} detected
                      </p>
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        {uniqueClasses.slice(0, 4).map((cls) => (
                          <span key={cls} className="text-[10px] text-slate-500">
                            {CLASS_ICONS[cls] ?? '●'}{cls}
                          </span>
                        ))}
                        {uniqueClasses.length > 4 && (
                          <span className="text-[10px] text-slate-600">+{uniqueClasses.length - 4} more</span>
                        )}
                      </div>
                    </div>

                    {/* Timestamp + expand */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock size={10} />
                        {formatTime(entry.timestamp)}
                      </span>
                      <span className="text-slate-600">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </div>
                  </div>

                  {/* Expanded panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-slate-800/60"
                      >
                        <div className="p-4 space-y-4">
                          {/* Filters used */}
                          {entry.filtersUsed.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
                                <SlidersHorizontal size={10} />
                                Filters Used
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {entry.filtersUsed.map((cls) => {
                                  const colors = getClassColor(cls)
                                  return (
                                    <span key={cls} className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${colors.border} ${colors.bg} ${colors.text}`}>
                                      {CLASS_ICONS[cls] ?? '●'} {cls}
                                    </span>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Class breakdown */}
                          {uniqueClasses.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
                                <Layers size={10} />
                                Class Breakdown
                              </p>
                              <div className="grid grid-cols-2 gap-1.5">
                                {uniqueClasses.map((cls) => {
                                  const count = entry.objects.filter((o) => o.class_name === cls).length
                                  const colors = getClassColor(cls)
                                  return (
                                    <div key={cls} className="flex items-center gap-2 rounded-lg border border-slate-800/60 bg-slate-900/40 px-2.5 py-1.5">
                                      <span className="text-sm">{CLASS_ICONS[cls] ?? '●'}</span>
                                      <span className="text-[11px] text-slate-300 capitalize flex-1">{cls}</span>
                                      <span className="font-mono text-[11px] font-bold" style={{ color: colors.hex }}>{count}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Export actions */}
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Export</p>
                            <div className="flex flex-wrap gap-2">
                              {entry.annotatedImageUrl && (
                                <button
                                  onClick={() => downloadAnnotatedImage(entry)}
                                  className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-800/40 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700/60 transition-colors"
                                >
                                  <ImageIcon size={12} className="text-cyan-400" />
                                  Annotated Image
                                </button>
                              )}
                              <button
                                onClick={() => exportCSV(entry)}
                                className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-800/40 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700/60 transition-colors"
                              >
                                <FileSpreadsheet size={12} className="text-emerald-400" />
                                CSV Report
                              </button>
                              <button
                                onClick={() => exportJSON(entry)}
                                className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-800/40 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700/60 transition-colors"
                              >
                                <FileText size={12} className="text-purple-400" />
                                JSON Report
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
