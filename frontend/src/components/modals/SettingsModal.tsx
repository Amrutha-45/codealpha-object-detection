import { motion } from 'framer-motion'
import { X, Sliders, Cpu } from 'lucide-react'
import Button from '../common/Button'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  confidence: number
  onConfidenceChange: (val: number) => void
  modelWeights: string
  onModelWeightsChange: (val: string) => void
}

export default function SettingsModal({
  isOpen,
  onClose,
  confidence,
  onConfidenceChange,
  modelWeights,
  onModelWeightsChange,
}: SettingsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="card-glass w-full max-w-lg p-6 space-y-6 border-slate-700/80 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Sliders size={20} className="text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100">AI Platform Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-5 text-sm">
          {/* Model Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Select YOLOv8 Model Variant
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['yolov8n.pt', 'yolov8s.pt', 'yolov8m.pt'].map((variant) => (
                <button
                  key={variant}
                  onClick={() => onModelWeightsChange(variant)}
                  className={`flex flex-col items-center justify-center rounded-xl p-3 border text-xs font-semibold transition-all ${
                    modelWeights === variant
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 shadow-glow'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Cpu size={18} className="mb-1 text-cyan-400" />
                  <span>{variant.replace('.pt', '')}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    {variant.includes('n') ? 'Nano' : variant.includes('s') ? 'Small' : 'Medium'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Confidence Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Default Confidence Threshold
              </label>
              <span className="text-xs font-bold text-cyan-400 font-mono">
                {Math.round(confidence * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.3}
              max={0.9}
              step={0.05}
              value={confidence}
              onChange={(e) => onConfidenceChange(parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          {/* Feature Toggles */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              System Preferences
            </label>
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-3">
              <span className="text-xs font-medium text-slate-300">Enable Center-Point Trail Tracker</span>
              <span className="h-4 w-4 rounded-full bg-cyan-500 flex items-center justify-center text-slate-950 font-bold text-[10px]">✓</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-3">
              <span className="text-xs font-medium text-slate-300">HTML5 Web H.264 Video Encoding</span>
              <span className="h-4 w-4 rounded-full bg-cyan-500 flex items-center justify-center text-slate-950 font-bold text-[10px]">✓</span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button variant="primary" onClick={onClose} className="w-full">
            Save &amp; Close Settings
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
