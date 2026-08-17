import axios from 'axios'
import type {
  ImageDetectionResponse,
  VideoDetectionResponse,
  WebcamControlResponse,
  StatsResponse,
} from '../types/detection'

// In dev, Vite proxies /detect, /stats, /download to the FastAPI backend (see vite.config.ts).
// In production, set VITE_API_BASE_URL to the deployed backend origin.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 120_000, // video processing can take a while
})

/**
 * Convert selectedClasses array to a comma-separated form param.
 * Empty array or undefined → omit param → backend detects ALL allowed classes.
 */
function classFilterToParam(classFilter?: string[]): string | undefined {
  return classFilter && classFilter.length > 0 ? classFilter.join(',') : undefined
}

export async function detectImage(
  file: File,
  confidence: number,
  classFilter?: string[],
  signal?: AbortSignal,
): Promise<ImageDetectionResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('confidence', String(confidence))
  const filterParam = classFilterToParam(classFilter)
  if (filterParam) formData.append('class_filter', filterParam)

  const { data } = await apiClient.post<ImageDetectionResponse>('/detect/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    signal,
  })
  return data
}

export async function detectVideo(
  file: File,
  confidence: number,
  classFilter?: string[],
  onUploadProgress?: (percent: number) => void,
): Promise<VideoDetectionResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('confidence', String(confidence))
  const filterParam = classFilterToParam(classFilter)
  if (filterParam) formData.append('class_filter', filterParam)

  const { data } = await apiClient.post<VideoDetectionResponse>('/detect/video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onUploadProgress && evt.total) {
        onUploadProgress(Math.round((evt.loaded / evt.total) * 100))
      }
    },
  })
  return data
}

export async function startWebcam(
  confidence: number,
  classFilter?: string[],
): Promise<WebcamControlResponse> {
  const { data } = await apiClient.post<WebcamControlResponse>('/detect/webcam/start', {
    action: 'start',
    confidence,
    class_filter: classFilter && classFilter.length > 0 ? classFilter : null,
  })
  return data
}

export async function stopWebcam(): Promise<WebcamControlResponse> {
  const { data } = await apiClient.post<WebcamControlResponse>('/detect/webcam/stop', {
    action: 'stop',
    confidence: 0.5,
  })
  return data
}

/**
 * Hot-swap detection filters on an active webcam session.
 * The backend capture thread picks up new values on the very next frame.
 */
export async function updateWebcam(
  confidence: number,
  classFilter?: string[],
): Promise<WebcamControlResponse> {
  const { data } = await apiClient.patch<WebcamControlResponse>('/detect/webcam/update', {
    confidence,
    class_filter: classFilter && classFilter.length > 0 ? classFilter : null,
  })
  return data
}

export function getWebcamStreamUrl(): string {
  return `${BASE_URL}/detect/webcam/stream`
}

export async function fetchStats(): Promise<StatsResponse> {
  const { data } = await apiClient.get<StatsResponse>('/stats')
  return data
}

export function getDownloadUrl(path: string): string {
  return `${BASE_URL}${path}`
}

export function getExportUrl(format: 'json' | 'csv'): string {
  return `${BASE_URL}/export/${format}`
}
