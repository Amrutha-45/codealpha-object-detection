/**
 * ActiveFilters.tsx
 * =================
 * Displays the currently active class filters as removable chip badges.
 * Each chip has a ✕ button to remove that specific filter.
 * Only visible when scopeMode === 'detect-selected' and at least one class is selected.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { X, SlidersHorizontal } from 'lucide-react'
import { CLASS_ICONS, getClassColor, DETECTABLE_CLASSES } from '../../types/detection'
import type { DetectionScopeMode } from '../../types/detection'

interface ActiveFiltersProps {
  selectedClasses: string[]
  scopeMode: DetectionScopeMode
  onChange: (classes: string[]) => void
  onScopeModeChange?: (mode: DetectionScopeMode) => void
  disabled?: boolean
}

export default function ActiveFilters({
  selectedClasses,
  scopeMode,
  onChange,
  onScopeModeChange,
  disabled,
}: ActiveFiltersProps) {
  if (scopeMode !== 'detect-selected') return null
  if (selectedClasses.length === 0) return null

  const removeClass = (cls: string) => {
    if (disabled) return
    const remaining = selectedClasses.filter((c) => c !== cls)
    onChange(remaining)
    if (remaining.length === 0) {
      onScopeModeChange?.('detect-all')
    }
  }

  const clearAll = () => {
    if (disabled) return
    onChange([])
    onScopeModeChange?.('detect-all')
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <SlidersHorizontal size={10} />
          Active Filters
        </span>

        <AnimatePresence>
          {selectedClasses.map((cls) => {
            const colors = getClassColor(cls)
            const icon = CLASS_ICONS[cls] ?? '●'
            return (
              <motion.div
                key={cls}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.15 }}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${colors.border} ${colors.bg} ${colors.text}`}
              >
                <span>{icon}</span>
                <span>{cls}</span>
                <button
                  onClick={() => removeClass(cls)}
                  disabled={disabled}
                  aria-label={`Remove ${cls} filter`}
                  className="ml-0.5 rounded-full hover:bg-white/10 transition-colors p-0.5 disabled:pointer-events-none"
                >
                  <X size={10} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {selectedClasses.length > 1 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={clearAll}
            disabled={disabled}
            className="text-[10px] font-bold text-slate-500 hover:text-rose-400 transition-colors ml-1 disabled:opacity-40 disabled:pointer-events-none"
          >
            Clear All
          </motion.button>
        )}

        {/* Count indicator */}
        <span className="ml-auto text-[10px] font-mono text-slate-500">
          {selectedClasses.length}/{DETECTABLE_CLASSES.length} selected
        </span>
      </div>
    </motion.div>
  )
}
