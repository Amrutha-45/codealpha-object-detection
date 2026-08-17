/**
 * ClassFilter.tsx
 * ===============
 * Class selection checkboxes for "Detect Selected" mode.
 * Greys out with a notice when scopeMode === 'detect-all' (filters are ignored).
 */

import { ListFilter } from 'lucide-react'
import { motion } from 'framer-motion'
import { DETECTABLE_CLASSES, CLASS_ICONS, getClassColor } from '../../types/detection'
import type { DetectionScopeMode } from '../../types/detection'

interface ClassFilterProps {
  selectedClasses: string[]
  onChange: (classes: string[]) => void
  scopeMode: DetectionScopeMode
  onScopeModeChange?: (mode: DetectionScopeMode) => void
  disabled?: boolean
}

export default function ClassFilter({
  selectedClasses,
  onChange,
  scopeMode,
  onScopeModeChange,
  disabled,
}: ClassFilterProps) {
  const isIgnored = scopeMode === 'detect-all'
  const isDisabled = disabled
  const effectiveSelected = isIgnored ? [] : selectedClasses

  const selectClass = (className: string) => {
    if (isDisabled) return
    if (effectiveSelected.length === 1 && effectiveSelected[0] === className) {
      // Toggle off -> Detect All
      onChange([])
      onScopeModeChange?.('detect-all')
    } else {
      // Single selection: replace previous class with newly selected class
      onChange([className])
      onScopeModeChange?.('detect-selected')
    }
  }

  const selectAll = () => {
    if (isDisabled) return
    onChange([])
    onScopeModeChange?.('detect-all')
  }

  return (
    <div className="card-glass p-5 transition-all duration-300">
      <div className="mb-4 flex items-center justify-between">
        <p className="section-title flex items-center gap-2">
          <ListFilter size={14} className="text-cyan-400" />
          Target Class Filter
        </p>
        <button
          type="button"
          disabled={isDisabled}
          onClick={selectAll}
          className="text-xs font-bold text-cyan-400 hover:text-cyan-300 disabled:opacity-50 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500/50 rounded px-1"
        >
          {effectiveSelected.length === 0 ? 'Detect All' : 'Reset to All'}
        </button>
      </div>

      {/* Mode hint */}
      {isIgnored && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2"
        >
          <p className="text-[10px] font-semibold text-emerald-400">
            🟢 Detect All mode active — click any class below to switch to single class detection.
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Detectable object classes filter">
        {DETECTABLE_CLASSES.map((className) => {
          const checked = effectiveSelected.includes(className)
          const colors = getClassColor(className)
          const icon = CLASS_ICONS[className] ?? '●'
          return (
            <button
              key={className}
              type="button"
              role="checkbox"
              aria-checked={checked}
              aria-label={`Toggle filter for ${className}`}
              disabled={isDisabled}
              onClick={() => selectClass(className)}
              style={checked ? {
                borderColor: colors.hex + '70',
                backgroundColor: colors.hex + '18',
              } : {}}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold capitalize transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                checked
                  ? 'text-slate-100 shadow-sm'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              } ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span aria-hidden="true">{icon}</span>
              <span className="truncate flex-1 text-left">{className}</span>
              {checked && (
                <span
                  className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: colors.hex }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
