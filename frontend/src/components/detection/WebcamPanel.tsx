import { useState, useEffect } from 'react'
import { Camera, CameraOff, Activity } from 'lucide-react'
import toast from 'react-hot-toast'
import { startWebcam, stopWebcam, updateWebcam, getWebcamStreamUrl } from '../../api/client'
import Button from '../common/Button'
import LoadingSpinner from '../common/LoadingSpinner'

interface WebcamPanelProps {
  confidence: number
  classFilter: string[]
  onSessionChange: (active: boolean) => void
}

export default function WebcamPanel({ confidence, classFilter, onSessionChange }: WebcamPanelProps) {
  const [isActive, setIsActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)

  // Hot-swap detection filters on the backend live webcam stream when user changes confidence or class selection
  useEffect(() => {
    if (!isActive) return
    const applyFilterUpdate = async () => {
      try {
        await updateWebcam(confidence, classFilter)
      } catch (err) {
        console.error('Failed to update live webcam filters:', err)
      }
    }
    applyFilterUpdate()
  }, [confidence, classFilter, isActive])

  const handleStart = async () => {
    setIsLoading(true)
    try {
      const res = await startWebcam(confidence, classFilter)
      if (res.success) {
        setIsActive(true)
        onSessionChange(true)
        setStreamUrl(`${getWebcamStreamUrl()}?t=${Date.now()}`)
        toast.success('Live Camera Feed initialized — detecting in real time.')
      }
    } catch (err) {
      toast.error('Failed to start webcam. Check camera availability & permissions.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStop = async () => {
    setIsLoading(true)
    try {
      await stopWebcam()
      setIsActive(false)
      onSessionChange(false)
      setStreamUrl(null)
      toast.success('Live camera session stopped cleanly.')
    } catch (err) {
      toast.error('Failed to stop webcam session.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="card-glass flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4">
        <div className="flex items-center gap-2">
          <Camera size={18} className="text-cyan-400" />
          <p className="font-bold text-slate-100">Live Camera Stream &amp; Tracking</p>
        </div>

        <div className="flex items-center gap-2">
          {!isActive ? (
            <Button variant="primary" icon={<Camera size={16} />} onClick={handleStart} disabled={isLoading}>
              Start Live Camera
            </Button>
          ) : (
            <Button variant="danger" icon={<CameraOff size={16} />} onClick={handleStop} disabled={isLoading}>
              Stop Camera Feed
            </Button>
          )}
        </div>
      </div>

      {/* Video Container */}
      <div className="relative flex aspect-video items-center justify-center bg-black overflow-hidden">
        {isLoading && <LoadingSpinner size="lg" label="Initializing Camera &amp; AI Engine..." />}

        {!isLoading && isActive && streamUrl && (
          <img
            src={streamUrl}
            alt="Live object detection stream"
            className="h-full w-full object-contain"
          />
        )}

        {!isLoading && !isActive && (
          <div className="flex flex-col items-center gap-3 text-slate-500 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
              <Camera size={32} strokeWidth={1.5} className="text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-300">Camera Feed is Offline</p>
              <p className="mt-1 text-xs text-slate-500 max-w-sm">
                Click "Start Live Camera" to connect your webcam feed to the YOLOv8 + ByteTrack detection engine.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Info Banner */}
      {isActive && (
        <div className="flex items-center justify-between border-t border-slate-800/80 px-6 py-3 bg-slate-950/40 text-xs">
          <span className="text-slate-400 flex items-center gap-2">
            <Activity size={14} className="text-emerald-400 animate-pulse" />
            Live stream processing active — persistent ByteTrack tracking IDs assigned.
          </span>
        </div>
      )}
    </div>
  )
}
