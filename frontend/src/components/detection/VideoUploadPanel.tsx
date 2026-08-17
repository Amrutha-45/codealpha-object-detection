import { useCallback, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { UploadCloud, Download, FileVideo, X, Sparkles, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { detectVideo, getDownloadUrl } from '../../api/client'
import type { VideoDetectionResponse } from '../../types/detection'
import Button from '../common/Button'
import LoadingSpinner from '../common/LoadingSpinner'

interface VideoUploadPanelProps {
  confidence: number
  classFilter: string[]
  onResult: (result: VideoDetectionResponse) => void
}

const ACCEPTED_TYPES = ['.mp4', '.avi', '.mov']

export default function VideoUploadPanel({ confidence, classFilter, onResult }: VideoUploadPanelProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<VideoDetectionResponse | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateAndSetFile = (candidate: File) => {
    const ext = candidate.name.slice(candidate.name.lastIndexOf('.')).toLowerCase()
    if (!ACCEPTED_TYPES.includes(ext)) {
      toast.error(`Unsupported file type. Allowed: ${ACCEPTED_TYPES.join(', ')}`)
      return
    }
    setFile(candidate)
    setResult(null)
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) validateAndSetFile(dropped)
  }, [])

  const handleProcess = async () => {
    if (!file) return
    setIsProcessing(true)
    setProgress(0)
    try {
      const res = await detectVideo(file, confidence, classFilter, setProgress)
      setResult(res)
      onResult(res)
      toast.success(`Processed ${res.total_frames} frames! Detected ${res.total_objects_detected} objects with ${res.unique_track_ids} unique tracks.`)
    } catch (err) {
      toast.error('Video processing failed. Please check backend logs or try a smaller video.')
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  const reset = () => {
    setFile(null)
    setResult(null)
  }

  return (
    <div className="card-glass flex flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4">
        <div className="flex items-center gap-2">
          <FileVideo size={18} className="text-purple-400" />
          <p className="font-bold text-slate-100">Video Processing &amp; Tracking Engine</p>
        </div>
        {result && (
          <span className="glass-pill border-purple-500/30 text-purple-300">
            {result.unique_track_ids} Unique Tracks
          </span>
        )}
      </div>

      <div className="p-6">
        {!file && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-all duration-300 ${
              isDragging
                ? 'border-purple-400 bg-purple-500/10 shadow-glow-purple'
                : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 shadow-xl text-purple-400">
              <UploadCloud size={32} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">Drag &amp; drop a video file, or click to browse</p>
              <p className="mt-1 text-xs text-slate-500">Supports MP4, AVI, MOV (Up to 200MB)</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              className="hidden"
              onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
            />
          </div>
        )}

        {file && !result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl border border-slate-800 bg-purple-500/10 text-purple-400">
                  <FileVideo size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-100">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                </div>
              </div>
              {!isProcessing && (
                <button onClick={reset} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              )}
            </div>

            {isProcessing ? (
              <div className="space-y-3 p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>Uploading &amp; Processing Video Frames...</span>
                  <span className="text-purple-400 font-mono">{progress}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <LoadingSpinner size="md" label="YOLOv8 + ByteTrack standardizing tracking IDs..." />
              </div>
            ) : (
              <Button variant="primary" icon={<Sparkles size={16} />} onClick={handleProcess} className="w-full py-3">
                Run Video Detection &amp; Tracking
              </Button>
            )}
          </div>
        )}

        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <video
              src={getDownloadUrl(result.output_video_url)}
              controls
              className="w-full rounded-2xl border border-slate-800 bg-black shadow-2xl max-h-[500px]"
            />

            <div className="grid grid-cols-4 gap-3 text-center">
              <StatChip label="Total Objects" value={result.total_objects_detected} />
              <StatChip label="Unique Track IDs" value={result.unique_track_ids} />
              <StatChip label="Total Frames" value={result.total_frames} />
              <StatChip label="Average FPS" value={result.average_fps.toFixed(1)} />
            </div>

            <div className="flex gap-3">
              <a
                href={getDownloadUrl(result.output_video_url)}
                download
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Download Annotated Video
              </a>
              <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={reset}>
                New Video
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function StatChip({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 py-3 px-2">
      <p className="text-xl font-extrabold text-purple-400">{value}</p>
      <p className="text-[11px] font-medium text-slate-400 mt-0.5">{label}</p>
    </div>
  )
}
