import { motion } from 'framer-motion'
import { X, Info, Cpu, Layers } from 'lucide-react'
import Button from '../common/Button'

interface AboutModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
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
            <Info size={20} className="text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100">About VisionTrack AI</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            <strong className="text-cyan-400">VisionTrack AI</strong> is a production-grade web platform engineered for real-time object detection and multi-object tracking.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs mb-1">
                <Cpu size={14} />
                YOLOv8 Engine
              </div>
              <p className="text-[11px] text-slate-400">
                Ultralytics PyTorch model providing ultra-fast single-pass detection across COCO categories.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs mb-1">
                <Layers size={14} />
                ByteTrack Algorithm
              </div>
              <p className="text-[11px] text-slate-400">
                High-performance object tracking preserving persistent IDs across occlusions and motion trails.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-1 text-[11px]">
            <p className="font-bold text-slate-200">Key Architectural Highlights:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>FastAPI Async REST API with MJPEG Stream pipeline</li>
              <li>Framer Motion &amp; Tailwind CSS Glassmorphic Dashboard</li>
              <li>JSON and CSV export for detection analytics</li>
              <li>Persistent Unique Tracking IDs across video frames</li>
            </ul>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="primary" onClick={onClose}>
            Got it
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
