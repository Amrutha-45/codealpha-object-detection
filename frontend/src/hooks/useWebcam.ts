import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { getWebcamStreamUrl, startWebcam, stopWebcam } from '../api/client'

interface UseWebcamOptions {
  confidence: number
  classFilter?: string[]
}

export function useWebcam({ confidence, classFilter }: UseWebcamOptions) {
  const [isActive, setIsActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)

  const start = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await startWebcam(confidence, classFilter)
      if (res.success) {
        setIsActive(true)
        // cache-bust so the <img> tag reconnects to the fresh MJPEG stream
        setStreamUrl(`${getWebcamStreamUrl()}?t=${Date.now()}`)
        toast.success('Webcam started')
      }
    } catch (err) {
      toast.error('Failed to start webcam. Check camera permissions.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [confidence, classFilter])

  const stop = useCallback(async () => {
    setIsLoading(true)
    try {
      await stopWebcam()
      setIsActive(false)
      setStreamUrl(null)
      toast.success('Webcam stopped')
    } catch (err) {
      toast.error('Failed to stop webcam.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { isActive, isLoading, streamUrl, start, stop }
}
