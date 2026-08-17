/**
 * ClassFilter.tsx
 * ===============
 * Target Class Filter component supporting single and multi-class selection.
 * Fully reactive with smooth glassmorphism and Framer Motion animations.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { ListFilter, Check, RotateCcw } from 'lucide-react'
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
  const isDetectAll = scopeMode === 'detect-all'
  const isDisabled = disabled
  const effectiveSelected = isDetectAll ? [] : selectedClasses

  const toggleClass = (className: string) => {
    if (isDisabled) return

    if (isDetectAll) {
      // Switching from Detect All to single class
      onChange([className])
      onScopeModeChange?.('detect-selected')
      return
    }

    if (selectedClasses.includes(className)) {
      // Unchecking this class
      const remaining = selectedClasses.filter((c) => c !== className)
      if (remaining.length === 0) {
        onChange([])
        onScopeModeChange?.('detect-all')
      } else {
        onChange(remaining)
      }
    } else {
      // Adding class to selection
      onChange([...selectedClasses, className])
    }
  }

  const selectOnlyClass = (className: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (isDisabled) return
    onChange([className])
    onScopeModeChange?.('detect-selected')
  }

  const handleResetToAll = () => {
    if (isDisabled) return
    onChange([])
    onScopeModeChange?.('detect-all')
  }

  const handleSelectAll = () => {
    if (isDisabled) return
    onChange([...DETECTABLE_CLASSES])
    onScopeModeChange?.('detect-selected')
  }

  return (
    <div className="card-glass p-5 transition-all duration-300">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListFilter size={15} className="text-cyan-400" />
          <span className="section-title">Target Class Filter</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isDisabled}
            onClick={handleResetToAll}
            className={`text-xs font-bold transition-colors focus:outline-none rounded px-1.5 py-0.5 ${
              isDetectAll
                ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Detect all objects without filtering"
          >
            Detect All
          </button>
          {!isDetectAll && (
            <button
              type="button"
              disabled={isDisabled}
              onClick={handleSelectAll}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors focus:outline-none rounded px-1"
              title="Select all classes for filtered detection"
            >
              All ({DETECTABLE_CLASSES.length})
            </button>
          )}
        </div>
      </div>

      {/* Mode hint banner */}
      <AnimatePresence mode="wait">
        {isDetectAll ? (
          <motion.div
            key="detect-all-hint"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2"
          >
            <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Detect All Mode — detecting all 80 COCO classes. Click any class to filter.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="detect-selected-hint"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 flex items-center justify-between"
          >
            <p className="text-[11px] font-semibold text-cyan-300">
              Filtered: {effectiveSelected.length} of {DETECTABLE_CLASSES.length} classes active
            </p>
            <button
              onClick={handleResetToAll}
              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
            >
              <RotateCcw size={10} /> Reset
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Class Checkbox Grid */}
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Detectable object classes filter">
        {DETECTABLE_CLASSES.map((className) => {
          const isChecked = !isDetectAll && selectedClasses.includes(className)
          const colors = getClassColor(className)
          const icon = CLASS_ICONS[className] ?? '●'

          return (
            <motion.button
              key={className}
              type="button"
              role="checkbox"
              aria-checked={isChecked}
              aria-label={`Toggle filter for ${className}`}
              disabled={isDisabled}
              whileTap={{ scale: 0.97 }}
              onClick={() => toggleClass(className)}
              style={isChecked ? {
                borderColor: colors.hex + '90',
                backgroundColor: colors.hex + '20',
                boxShadow: `0 0 12px ${colors.hex}25`,
              } : {}}
              className={`group relative flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs font-semibold capitalize transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                isChecked
                  ? `${colors.text}`
                  : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              } ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-sm" aria-hidden="true">{icon}</span>
                <span className="truncate">{className}</span>
              </div>

              <div className="flex items-center gap-1 ml-1 flex-shrink-0">
                {/* Only button to focus solely on this class on hover */}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => selectOnlyClass(className, e)}
                  title={`Only detect ${className}`}
                  className="opacity-0 group-hover:opacity-100 text-[9px] font-bold text-slate-400 hover:text-cyan-300 hover:underline px-1 transition-opacity"
                >
                  only
                </span>

                {/* Check indicator */}
                {isChecked ? (
                  <span
                    className="flex h-4 w-4 items-center justify-center rounded-md text-slate-950 font-bold"
                    style={{ backgroundColor: colors.hex }}
                  >
                    <Check size={11} strokeWidth={3} />
                  </span>
                ) : (
                  <span className="h-4 w-4 rounded-md border border-slate-700 flex items-center justify-center group-hover:border-slate-500 transition-colors">
                    <span className="h-1.5 w-1.5 rounded-sm bg-transparent group-hover:bg-slate-600 transition-colors" />
                  </span>
                )}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

