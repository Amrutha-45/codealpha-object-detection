import { useState } from 'react'
import { Search, Download, ListFilter } from 'lucide-react'
import type { TrackedObject } from '../../types/detection'

interface DetectionHistoryTableProps {
  objects: TrackedObject[]
  onExportJSON: () => void
  onExportCSV: () => void
}

export default function DetectionHistoryTable({
  objects,
  onExportJSON,
  onExportCSV,
}: DetectionHistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredObjects = objects.filter((obj) => {
    const matchesSearch =
      obj.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(obj.track_id).includes(searchTerm) ||
      obj.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory =
      selectedCategory === 'all' || obj.category.toLowerCase() === selectedCategory.toLowerCase()

    return matchesSearch && matchesCategory
  })

  return (
    <div className="card-glass p-6 space-y-4">
      {/* Table Header Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ListFilter size={18} className="text-cyan-400" />
            Detection &amp; Tracking Log History
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time object stream with bounding boxes, confidence ratings &amp; unique IDs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportJSON}
            className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
          >
            <Download size={13} className="text-cyan-400" />
            Export JSON
          </button>
          <button
            onClick={onExportCSV}
            className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
          >
            <Download size={13} className="text-purple-400" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search class, track ID (#1), category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950/60 pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {['all', 'person', 'vehicle', 'animal', 'object'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                selectedCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3">Track ID</th>
              <th className="px-4 py-3">Class Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-4 py-3">Bounding Box (XYXY)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
            {filteredObjects.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No objects match the selected filter.
                </td>
              </tr>
            ) : (
              filteredObjects.map((obj, i) => (
                <tr key={`${obj.track_id}-${i}`} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-cyan-300">
                      #{obj.track_id !== -1 ? obj.track_id : 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold capitalize text-slate-100">
                    {obj.class_name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-slate-700/60 bg-slate-900 px-2.5 py-0.5 text-[10px] uppercase font-bold text-slate-400">
                      {obj.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                          style={{ width: `${Math.round(obj.confidence * 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-cyan-400 font-bold">
                        {Math.round(obj.confidence * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                    [{obj.bbox.x1.toFixed(0)}, {obj.bbox.y1.toFixed(0)}, {obj.bbox.x2.toFixed(0)}, {obj.bbox.y2.toFixed(0)}]
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
