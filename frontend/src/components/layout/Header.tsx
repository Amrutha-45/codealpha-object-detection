import {
  Activity,
  Cpu,
  Download,
  Settings,
  Menu,
  Command,
  Sun,
  Moon,
} from 'lucide-react'
import type { DetectionMode } from './Sidebar'

interface HeaderProps {
  activeMode: DetectionMode
  isSessionActive: boolean
  modelName?: string
  onOpenSettings: () => void
  onOpenShortcuts: () => void
  onExport: (format: 'json' | 'csv') => void
  onToggleMobileMenu?: () => void
  darkMode: boolean
  onToggleDarkMode: () => void
}

const MODE_TITLE_MAP: Record<DetectionMode, string> = {
  landing: 'Overview & Features',
  webcam: 'Live Camera Detection & Tracking',
  video: 'Video File Detection & Tracking',
  image: 'Single Image Inference',
  analytics: 'Analytics & Distribution Charts',
  history: 'Detection Records & History',
}

export default function Header({
  activeMode,
  isSessionActive,
  modelName = 'YOLOv8n',
  onOpenSettings,
  onOpenShortcuts,
  onExport,
  onToggleMobileMenu,
  darkMode,
  onToggleDarkMode,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl px-4 py-3.5 md:px-8">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Toggle & Title */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 md:hidden"
            >
              <Menu size={18} />
            </button>
          )}

          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-100 sm:text-xl">
              {MODE_TITLE_MAP[activeMode]}
            </h1>
            <p className="hidden text-xs text-slate-400 sm:block">
              VisionTrack AI • Real-time detection &amp; ByteTrack persistent ID system
            </p>
          </div>
        </div>

        {/* Right Side: Badges & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Model Badge */}
          <span className="hidden items-center gap-1.5 rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1 text-xs font-semibold text-slate-300 sm:flex">
            <Cpu size={13} className="text-cyan-400" />
            {modelName}
          </span>

          {/* Live Status Badge */}
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
              isSessionActive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-glow-emerald'
                : 'bg-slate-800/40 text-slate-400 border-slate-700/50'
            }`}
          >
            <Activity size={13} className={isSessionActive ? 'animate-pulse text-emerald-400' : ''} />
            {isSessionActive ? 'Live Streaming' : 'Idle'}
          </span>

          {/* Export Dropdown / Action */}
          <div className="relative group">
            <button className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/80 px-3 text-xs font-semibold text-slate-300 hover:border-slate-600 hover:text-white transition-colors">
              <Download size={14} className="text-cyan-400" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <div className="absolute right-0 top-full mt-1 hidden w-36 rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-2xl group-hover:block z-50">
              <button
                onClick={() => onExport('json')}
                className="w-full text-left rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-cyan-400"
              >
                Export JSON
              </button>
              <button
                onClick={() => onExport('csv')}
                className="w-full text-left rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-cyan-400"
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* Hotkeys Button */}
          <button
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/80 text-slate-400 hover:border-slate-600 hover:text-slate-200 transition-colors"
          >
            <Command size={15} />
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            title="Toggle Theme"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/80 text-slate-400 hover:border-slate-600 hover:text-amber-400 transition-colors"
          >
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            title="Settings"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/80 text-slate-400 hover:border-slate-600 hover:text-cyan-400 transition-colors"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>
    </header>
  )
}
