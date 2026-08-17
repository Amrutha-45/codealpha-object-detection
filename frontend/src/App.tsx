import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import Sidebar, { type DetectionMode } from './components/layout/Sidebar'
import Header from './components/layout/Header'
import StatsCards from './components/stats/StatsCards'
import StatsAnalyticsCharts from './components/stats/StatsAnalyticsCharts'
import ConfidenceSlider from './components/detection/ConfidenceSlider'
import ClassFilter from './components/detection/ClassFilter'
import DetectionModeSelector from './components/detection/DetectionMode'
import DetectionStats from './components/detection/DetectionStats'
import WebcamPanel from './components/detection/WebcamPanel'
import VideoUploadPanel from './components/detection/VideoUploadPanel'
import ImageUploadPanel from './components/detection/ImageUploadPanel'
import DetectionHistory from './components/detection/DetectionHistory'
import LandingHero from './components/landing/LandingHero'
import SettingsModal from './components/modals/SettingsModal'
import AboutModal from './components/modals/AboutModal'
import KeyboardShortcutsModal from './components/modals/KeyboardShortcutsModal'
import ToastHost from './components/common/Toast'
import type { DetectionStats as DetectionStatsType, DetectionScopeMode, HistoryEntry, ImageDetectionResponse } from './types/detection'
import { useDetectionStats } from './hooks/useDetectionStats'
import { getExportUrl } from './api/client'
import { X } from 'lucide-react'

const HISTORY_STORAGE_KEY = 'visiontrack_detection_history'

function loadHistoryFromStorage(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as HistoryEntry[]
  } catch {
    return []
  }
}

function saveHistoryToStorage(entries: HistoryEntry[]) {
  try {
    // Keep only last 50 entries to avoid storage bloat
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries.slice(0, 50)))
  } catch {
    // localStorage full — silently ignore
  }
}

export default function App() {
  const [activeMode, setActiveMode] = useState<DetectionMode>('landing')
  const [confidence, setConfidence] = useState(0.5)

  // Detection scope mode: 'detect-all' (default) | 'detect-selected'
  const [scopeMode, setScopeMode] = useState<DetectionScopeMode>('detect-all')

  // Class filter — only used when scopeMode === 'detect-selected'
  const [classFilter, setClassFilter] = useState<string[]>([])

  const handleScopeModeChange = useCallback((mode: DetectionScopeMode) => {
    setScopeMode(mode)
    if (mode === 'detect-all') {
      setClassFilter([])
    } else {
      setClassFilter((prev) => (prev.length === 0 ? ['person'] : prev))
    }
  }, [])

  const handleClassFilterChange = useCallback((classes: string[]) => {
    setClassFilter(classes)
    if (classes.length === 0) {
      setScopeMode('detect-all')
    } else {
      setScopeMode('detect-selected')
    }
  }, [])

  const [isWebcamActive, setIsWebcamActive] = useState(false)
  const [lastResultStats, setLastResultStats] = useState<DetectionStatsType | null>(null)
  const [currentImageResult, setCurrentImageResult] = useState<ImageDetectionResponse | null>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [modelWeights, setModelWeights] = useState('yolov8n.pt')
  const [darkMode, setDarkMode] = useState(true)

  // Detection history — persisted to localStorage
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>(loadHistoryFromStorage)

  // Modal dialog states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)

  // Poll stats during webcam active session
  const liveStats = useDetectionStats(isWebcamActive, 1000)
  const displayedStats = activeMode === 'webcam' ? liveStats : lastResultStats

  // Persist history whenever it changes
  useEffect(() => {
    saveHistoryToStorage(historyEntries)
  }, [historyEntries])

  // Keyboard hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsShortcutsOpen((prev) => !prev)
        return
      }
      if (e.key === 'Escape') {
        setIsSettingsOpen(false)
        setIsAboutOpen(false)
        setIsShortcutsOpen(false)
        setIsMobileMenuOpen(false)
        return
      }
      if (e.key === '1') setActiveMode('webcam')
      if (e.key === '2') setActiveMode('video')
      if (e.key === '3') setActiveMode('image')
      if (e.key === '4') setActiveMode('analytics')
      if (e.key === '5') setActiveMode('history')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleExport = (format: 'json' | 'csv') => {
    const url = getExportUrl(format)
    window.open(url, '_blank')
    toast.success(`Exporting detection history as ${format.toUpperCase()}...`)
  }

  const handleModeChange = (mode: DetectionMode) => {
    setActiveMode(mode)
    setIsMobileMenuOpen(false)
  }

  const handleHistoryEntry = useCallback((entry: HistoryEntry) => {
    setHistoryEntries((prev) => [entry, ...prev])
  }, [])

  const handleImageResult = useCallback((res: ImageDetectionResponse) => {
    setCurrentImageResult(res)
    const objects = res.result.objects
    setLastResultStats({
      total_objects_detected: objects.length,
      person_count: objects.filter((o) => o.category === 'person').length,
      vehicle_count: objects.filter((o) => o.category === 'vehicle').length,
      animal_count: objects.filter((o) => o.category === 'animal').length,
      other_count: objects.filter((o) => o.category === 'object').length,
      average_fps: res.result.fps || 30.0,
      average_inference_time_ms: res.result.inference_time_ms,
      active_track_ids: objects.length,
      session_duration_sec: 1,
    })
  }, [])

  const handleClearHistory = () => {
    setHistoryEntries([])
    toast.success('Detection history cleared.')
  }

  // The objects currently visible in image mode (for DetectionStats sidebar)
  const imageObjects = currentImageResult
    ? scopeMode === 'detect-all'
      ? currentImageResult.result.objects
      : currentImageResult.result.objects.filter((o) =>
          classFilter.length === 0 || classFilter.map((c) => c.toLowerCase()).includes(o.class_name.toLowerCase())
        )
    : []

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${darkMode ? 'dark bg-[#050811]' : 'bg-slate-900'} text-slate-100`}>
      <ToastHost />

      {/* Desktop Sidebar */}
      <Sidebar
        activeMode={activeMode}
        onModeChange={handleModeChange}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* Mobile Sidebar Overlay Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="relative w-72 bg-slate-950 h-full border-r border-slate-800 shadow-2xl flex flex-col z-10"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <span className="font-bold text-slate-100">VisionTrack AI</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 flex-1">
                <Sidebar
                  activeMode={activeMode}
                  onModeChange={handleModeChange}
                  isCollapsed={false}
                  onToggleCollapse={() => {}}
                  onOpenSettings={() => { setIsSettingsOpen(true); setIsMobileMenuOpen(false) }}
                  onOpenAbout={() => { setIsAboutOpen(true); setIsMobileMenuOpen(false) }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content View */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Header
          activeMode={activeMode}
          isSessionActive={isWebcamActive}
          modelName={modelWeights.replace('.pt', '').toUpperCase()}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onExport={handleExport}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        />

        <main className="flex-1 p-4 md:p-8 space-y-6">
          <AnimatePresence mode="wait">
            {activeMode === 'landing' && (
              <motion.div
                key="landing"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <LandingHero onLaunchDashboard={() => setActiveMode('webcam')} />
              </motion.div>
            )}

            {activeMode !== 'landing' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Stats Cards Row */}
                <StatsCards stats={displayedStats} />

                {/* Primary Mode View */}
                {activeMode === 'analytics' ? (
                  <StatsAnalyticsCharts stats={displayedStats} />
                ) : activeMode === 'history' ? (
                  <DetectionHistory
                    entries={historyEntries}
                    onClearAll={handleClearHistory}
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
                    {/* Primary Panel */}
                    <div className="space-y-6">
                      {activeMode === 'webcam' && (
                        <WebcamPanel
                          confidence={confidence}
                          classFilter={classFilter}
                          onSessionChange={setIsWebcamActive}
                        />
                      )}

                      {activeMode === 'video' && (
                        <VideoUploadPanel
                          confidence={confidence}
                          classFilter={classFilter}
                          onResult={(res) => {
                            setLastResultStats(res.stats)
                          }}
                        />
                      )}

                      {activeMode === 'image' && (
                        <>
                          <ImageUploadPanel
                            confidence={confidence}
                            classFilter={classFilter}
                            scopeMode={scopeMode}
                            onClassFilterChange={handleClassFilterChange}
                            onScopeModeChange={handleScopeModeChange}
                            onResult={handleImageResult}
                            onHistoryEntry={handleHistoryEntry}
                          />

                          {/* DetectionStats below the panel */}
                          {currentImageResult && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              <DetectionStats
                                objects={imageObjects}
                                scopeMode={scopeMode}
                                selectedClasses={classFilter}
                                inferenceTimeMs={currentImageResult.result.inference_time_ms}
                              />
                            </motion.div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Controls Sidebar */}
                    <div className="space-y-4">
                      <ConfidenceSlider
                        confidence={confidence}
                        onChange={setConfidence}
                      />

                      {/* Detection Mode selector — above ClassFilter */}
                      {activeMode === 'image' && (
                        <DetectionModeSelector
                          mode={scopeMode}
                          onChange={handleScopeModeChange}
                        />
                      )}

                      <ClassFilter
                        selectedClasses={classFilter}
                        onChange={handleClassFilterChange}
                        onScopeModeChange={handleScopeModeChange}
                        scopeMode={activeMode === 'image' ? scopeMode : 'detect-selected'}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Modal Dialogs */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        confidence={confidence}
        onConfidenceChange={setConfidence}
        modelWeights={modelWeights}
        onModelWeightsChange={setModelWeights}
      />
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  )
}
