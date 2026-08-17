/**
 * DetectionMode.tsx
 * =================
 * Animated toggle between:
 *   🟢 Detect All     — YOLO detects every supported class (no filter sent)
 *   🎯 Detect Selected — YOLO only detects user-selected classes
 */

import { motion } from 'framer-motion'
import { Scan, Target } from 'lucide-react'
import type { DetectionScopeMode } from '../../types/detection'

interface DetectionModeProps {
  mode: DetectionScopeMode
  onChange: (mode: DetectionScopeMode) => void
  disabled?: boolean
}

const MODES: { value: DetectionScopeMode; label: string; desc: string; icon: React.ReactNode; accent: string }[] = [
  {
    value: 'detect-all',
    label: 'Detect All',
    desc: 'Every YOLO class',
    icon: <Scan size={15} />,
    accent: 'text-emerald-400',
  },
  {
    value: 'detect-selected',
    label: 'Detect Selected',
    desc: 'Only chosen classes',
    icon: <Target size={15} />,
    accent: 'text-cyan-400',
  },
]

export default function DetectionMode({ mode, onChange, disabled }: DetectionModeProps) {
  return (
    <div className="card-glass p-4">
      <p className="section-title mb-3 flex items-center gap-2">
        <Target size={13} className="text-cyan-400" />
        Detection Mode
      </p>

      <div className="flex gap-2" role="radiogroup" aria-label="Detection scope mode">
        {MODES.map((m) => {
          const isActive = mode === m.value
          return (
            <button
              key={m.value}
              role="radio"
              aria-checked={isActive}
              aria-label={m.label}
              disabled={disabled}
              onClick={() => onChange(m.value)}
              className={`relative flex-1 flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-center transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:opacity-50 disabled:pointer-events-none ${
                isActive
                  ? m.value === 'detect-all'
                    ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_16px_rgba(52,211,153,0.15)]'
                    : 'border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_16px_rgba(34,211,238,0.15)]'
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
              }`}
            >
              {/* Active indicator dot */}
              {isActive && (
                <motion.span
                  layoutId="detection-mode-dot"
                  className={`absolute top-2 right-2 h-2 w-2 rounded-full ${
                    m.value === 'detect-all' ? 'bg-emerald-400' : 'bg-cyan-400'
                  } shadow-glow`}
                />
              )}

              <span className={`${isActive ? m.accent : 'text-slate-500'} transition-colors`}>
                {m.icon}
              </span>
              <span className={`text-[11px] font-extrabold uppercase tracking-wide ${isActive ? 'text-slate-100' : 'text-slate-400'} transition-colors`}>
                {m.label}
              </span>
              <span className={`text-[10px] font-medium ${isActive ? 'text-slate-400' : 'text-slate-600'} transition-colors`}>
                {m.desc}
              </span>
            </button>
          )
        })}
      </div>

      {/* Description line */}
      <motion.p
        key={mode}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 text-[11px] text-slate-500 text-center leading-snug"
      >
        {mode === 'detect-all'
          ? '🟢 All YOLO-supported objects will be detected. Class filters are ignored.'
          : '🎯 Only the classes you select below will be sent to YOLO for detection.'}
      </motion.p>
    </div>
  )
}
