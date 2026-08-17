import { SlidersHorizontal } from 'lucide-react'

interface ConfidenceSliderProps {
  confidence: number
  onChange: (value: number) => void
  disabled?: boolean
}

const PRESETS = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]

export default function ConfidenceSlider({ confidence, onChange, disabled }: ConfidenceSliderProps) {
  return (
    <div className="card-glass p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="section-title flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-cyan-400" />
          Detection Confidence Threshold
        </p>
        <span className="rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 font-mono text-xs font-bold text-cyan-400 shadow-glow">
          {Math.round(confidence * 100)}%
        </span>
      </div>

      <input
        type="range"
        min={0.3}
        max={0.9}
        step={0.05}
        value={confidence}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-cyan-400 disabled:opacity-50 cursor-pointer"
      />

      <div className="mt-3 flex justify-between">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            disabled={disabled}
            onClick={() => onChange(preset)}
            className={`text-[11px] font-bold font-mono transition-colors disabled:cursor-not-allowed ${
              Math.abs(confidence - preset) < 0.02
                ? 'text-cyan-400 underline underline-offset-4'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {Math.round(preset * 100)}%
          </button>
        ))}
      </div>
    </div>
  )
}
