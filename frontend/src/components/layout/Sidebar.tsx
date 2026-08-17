import { motion } from 'framer-motion'
import {
  Camera,
  Video,
  Image as ImageIcon,
  LayoutDashboard,
  BarChart3,
  History,
  Settings,
  Info,
  ChevronLeft,
  ChevronRight,
  Home,
} from 'lucide-react'

export type DetectionMode = 'landing' | 'webcam' | 'video' | 'image' | 'analytics' | 'history'

interface SidebarProps {
  activeMode: DetectionMode
  onModeChange: (mode: DetectionMode) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  onOpenSettings: () => void
  onOpenAbout: () => void
}

interface NavItem {
  mode: DetectionMode
  label: string
  icon: JSX.Element
  category?: string
}

const NAV_ITEMS: NavItem[] = [
  { mode: 'landing', label: 'Home / Overview', icon: <Home size={18} /> },
  { mode: 'webcam', label: 'Live Webcam Stream', icon: <Camera size={18} /> },
  { mode: 'video', label: 'Video Upload & Track', icon: <Video size={18} /> },
  { mode: 'image', label: 'Image Detection', icon: <ImageIcon size={18} /> },
  { mode: 'analytics', label: 'Analytics & Charts', icon: <BarChart3 size={18} /> },
  { mode: 'history', label: 'Detection History', icon: <History size={18} /> },
]

export default function Sidebar({
  activeMode,
  onModeChange,
  isCollapsed,
  onToggleCollapse,
  onOpenSettings,
  onOpenAbout,
}: SidebarProps) {
  return (
    <motion.aside
      animate={{ width: isCollapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative hidden md:flex flex-col border-r border-slate-800/80 bg-slate-950/80 backdrop-blur-xl z-30"
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-7 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-300 shadow-md hover:bg-slate-800 hover:text-white"
        aria-label="Toggle Sidebar"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Header / Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800/80">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 shadow-glow">
          <LayoutDashboard size={20} className="text-white" />
        </div>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden whitespace-nowrap"
          >
            <p className="font-extrabold text-slate-100 leading-tight tracking-wide text-base">
              VisionTrack <span className="text-cyan-400">AI</span>
            </p>
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              YOLOv8 + ByteTrack
            </p>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {!isCollapsed && (
          <p className="section-title px-3 mb-2 text-[10px]">Navigation</p>
        )}

        {NAV_ITEMS.map((item) => {
          const isActive = activeMode === item.mode
          return (
            <button
              key={item.mode}
              onClick={() => onModeChange(item.mode)}
              title={isCollapsed ? item.label : undefined}
              className={`relative w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200
                ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-300 border border-cyan-500/30 shadow-glow'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>
                {item.icon}
              </span>
              {!isCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {isActive && !isCollapsed && (
                <motion.span
                  layoutId="activeIndicator"
                  className="ml-auto h-2 w-2 rounded-full bg-cyan-400 shadow-glow"
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom Action Section */}
      <div className="px-3 py-4 border-t border-slate-800/80 space-y-1">
        <button
          onClick={onOpenSettings}
          title={isCollapsed ? 'Settings' : undefined}
          className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-colors ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
        >
          <Settings size={16} />
          {!isCollapsed && <span>Settings</span>}
        </button>
        <button
          onClick={onOpenAbout}
          title={isCollapsed ? 'About Project' : undefined}
          className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-colors ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
        >
          <Info size={16} />
          {!isCollapsed && <span>About VisionTrack</span>}
        </button>
      </div>
    </motion.aside>
  )
}
