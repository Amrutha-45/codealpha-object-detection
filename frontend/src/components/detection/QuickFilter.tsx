/**
 * QuickFilter.tsx
 * ===============
 * Horizontal scrollable quick-filter pill bar rendered above the detection image.
 * Clicking a class pill toggles it in/out of the selected filter set.
 * The "All" pill clears individual selections (meaning: detect all classes).
 */

import { motion } from 'framer-motion'
import { DETECTABLE_CLASSES, CLASS_ICONS, getClassColor } from '../../types/detection'
import type { DetectionScopeMode } from '../../types/detection'

interface QuickFilterProps {
  selectedClasses: string[]
  scopeMode: DetectionScopeMode
  onChange: (classes: string[]) => void
  onScopeModeChange?: (mode: DetectionScopeMode) => void
  disabled?: boolean
}

export default function QuickFilter({
  selectedClasses,
  scopeMode,
  onChange,
  onScopeModeChange,
  disabled,
}: QuickFilterProps) {
  const isDetectAll = scopeMode === 'detect-all'
  const effectiveSelected = isDetectAll ? [] : selectedClasses

  const selectClass = (className: string) => {
    if (disabled) return
    if (effectiveSelected.length === 1 && effectiveSelected[0] === className) {
      // Clicking active class again toggles back to All
      onChange([])
      onScopeModeChange?.('detect-all')
    } else {
      // Single selection: replace previous class with newly selected class
      onChange([className])
      onScopeModeChange?.('detect-selected')
    }
  }

  const selectAll = () => {
    if (disabled) return
    onChange([])
    onScopeModeChange?.('detect-all')
  }

  return (
    <div className="w-full">
      {/* Scrollable pill row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 quick-filter-scroll">
        {/* "All" pill */}
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={selectAll}
          disabled={disabled}
          aria-label="Show all classes"
          className={`flex-shrink-0 flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:opacity-40 disabled:pointer-events-none ${
            effectiveSelected.length === 0
              ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
              : 'border-slate-700/60 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:text-slate-200'
          }`}
        >
          <span className="text-[11px]">✦</span>
          <span>All</span>
        </motion.button>

        {/* Class pills */}
        {DETECTABLE_CLASSES.map((cls) => {
          const active = effectiveSelected.includes(cls)
          const colors = getClassColor(cls)
          return (
            <motion.button
              key={cls}
              whileTap={{ scale: 0.93 }}
              onClick={() => selectClass(cls)}
              disabled={disabled}
              aria-label={`Filter by ${cls}`}
              aria-pressed={active}
              className={`flex-shrink-0 flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:opacity-40 disabled:pointer-events-none ${
                active
                  ? `${colors.border} ${colors.bg} ${colors.text} shadow-sm`
                  : 'border-slate-700/60 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              <span>{CLASS_ICONS[cls]}</span>
              <span>{cls}</span>
              {active && (
                <span
                  className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: colors.hex }}
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
