// =========================================================
// Type definitions mirroring backend/app/models/schemas.py
// =========================================================

export type ObjectCategory = 'person' | 'vehicle' | 'animal' | 'object'

/** Controls whether YOLO filters to selected classes or detects everything */
export type DetectionScopeMode = 'detect-all' | 'detect-selected'

export interface BoundingBox {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface TrackedObject {
  track_id: number
  class_name: string
  category: ObjectCategory
  confidence: number
  bbox: BoundingBox
  trail?: [number, number][]
}

export interface FrameResult {
  frame_index: number
  timestamp_ms: number
  objects: TrackedObject[]
  inference_time_ms: number
  fps: number
}

export interface DetectionStats {
  total_objects_detected: number
  person_count: number
  vehicle_count: number
  animal_count: number
  other_count: number
  average_fps: number
  average_inference_time_ms: number
  active_track_ids: number
  session_duration_sec: number
}

export interface ImageDetectionResponse {
  success: boolean
  message: string
  result: FrameResult
  annotated_image_url: string
  clean_image_url?: string
  screenshot_id: string
}

export interface VideoDetectionResponse {
  success: boolean
  message: string
  output_video_url: string
  total_frames: number
  total_objects_detected: number
  unique_track_ids: number
  average_fps: number
  average_inference_time_ms: number
  stats: DetectionStats
}

export interface WebcamControlResponse {
  success: boolean
  message: string
  session_active: boolean
  stream_endpoint?: string
}

export interface StatsResponse {
  success: boolean
  stats: DetectionStats
}

export interface ErrorResponse {
  success: false
  error: string
  detail?: string
}

/** A saved detection session for the history page */
export interface HistoryEntry {
  id: string
  timestamp: number          // epoch ms
  imageDataUrl: string       // base64 thumbnail
  cleanImageUrl?: string     // full-res clean image URL (from backend)
  annotatedImageUrl?: string // full-res annotated URL (from backend)
  objects: TrackedObject[]
  totalDetected: number
  inferenceTimeMs: number
  scopeMode: DetectionScopeMode
  filtersUsed: string[]      // class names that were active
}

// --- Detectable classes surfaced in the UI's class filter checklist ---
export const DETECTABLE_CLASSES = [
  'person',
  'car',
  'bicycle',
  'bus',
  'truck',
  'dog',
  'cat',
  'bottle',
  'chair',
  'laptop',
] as const

export type DetectableClass = (typeof DETECTABLE_CLASSES)[number]

/** Per-class display icons */
export const CLASS_ICONS: Record<string, string> = {
  person:  '👤',
  car:     '🚗',
  bicycle: '🚲',
  bus:     '🚌',
  truck:   '🚛',
  dog:     '🐶',
  cat:     '🐱',
  bottle:  '🍼',
  chair:   '🪑',
  laptop:  '💻',
}

/** Per-class bounding box colors (Tailwind-style: border / bg / text / hex) */
export const CLASS_COLORS: Record<string, {
  border: string
  bg: string
  text: string
  badgeBg: string
  hex: string
}> = {
  person:  { border: 'border-blue-400',    bg: 'bg-blue-500/15',    text: 'text-blue-300',    badgeBg: 'bg-blue-500/90 text-white',    hex: '#60a5fa' },
  car:     { border: 'border-green-400',   bg: 'bg-green-500/15',   text: 'text-green-300',   badgeBg: 'bg-green-500/90 text-white',   hex: '#4ade80' },
  bicycle: { border: 'border-yellow-400',  bg: 'bg-yellow-500/15',  text: 'text-yellow-300',  badgeBg: 'bg-yellow-500/90 text-slate-900', hex: '#facc15' },
  bus:     { border: 'border-orange-400',  bg: 'bg-orange-500/15',  text: 'text-orange-300',  badgeBg: 'bg-orange-500/90 text-white',  hex: '#fb923c' },
  truck:   { border: 'border-red-400',     bg: 'bg-red-500/15',     text: 'text-red-300',     badgeBg: 'bg-red-500/90 text-white',     hex: '#f87171' },
  dog:     { border: 'border-purple-400',  bg: 'bg-purple-500/15',  text: 'text-purple-300',  badgeBg: 'bg-purple-500/90 text-white',  hex: '#c084fc' },
  cat:     { border: 'border-pink-400',    bg: 'bg-pink-500/15',    text: 'text-pink-300',    badgeBg: 'bg-pink-500/90 text-white',    hex: '#f472b6' },
  bottle:  { border: 'border-amber-400',   bg: 'bg-amber-500/15',   text: 'text-amber-300',   badgeBg: 'bg-amber-500/90 text-slate-900', hex: '#fbbf24' },
  chair:   { border: 'border-rose-400',    bg: 'bg-rose-500/15',    text: 'text-rose-300',    badgeBg: 'bg-rose-500/90 text-white',    hex: '#fb7185' },
  laptop:  { border: 'border-cyan-400',    bg: 'bg-cyan-500/15',    text: 'text-cyan-300',    badgeBg: 'bg-cyan-500/90 text-slate-900', hex: '#22d3ee' },
  // fallback for unknown classes
  unknown: { border: 'border-slate-400',   bg: 'bg-slate-500/15',   text: 'text-slate-300',   badgeBg: 'bg-slate-500/90 text-white',   hex: '#94a3b8' },
}

/** Get color config for a class name, with fallback */
export function getClassColor(className: string) {
  return CLASS_COLORS[className.toLowerCase()] ?? CLASS_COLORS.unknown
}
