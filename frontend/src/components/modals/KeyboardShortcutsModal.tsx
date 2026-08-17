import { motion } from 'framer-motion'
import { X, Keyboard } from 'lucide-react'
import Button from '../common/Button'

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null

  const shortcuts = [
    { key: '1', description: 'Switch to Live Webcam mode' },
    { key: '2', description: 'Switch to Video Upload mode' },
    { key: '3', description: 'Switch to Image Detection mode' },
    { key: '4', description: 'Switch to Analytics & Charts' },
    { key: '5', description: 'Switch to Detection History' },
    { key: 'Space', description: 'Start / Stop camera feed (when active)' },
    { key: 'Cmd/Ctrl + K', description: 'Open Keyboard Shortcuts' },
    { key: 'Esc', description: 'Close any open modal dialog' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="card-glass w-full max-w-md p-6 space-y-5 border-slate-700/80 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Keyboard size={20} className="text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2.5">
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-2.5 text-xs"
            >
              <span className="text-slate-300 font-medium">{sc.description}</span>
              <kbd className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 font-mono text-[11px] font-bold text-cyan-400 shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="primary" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
