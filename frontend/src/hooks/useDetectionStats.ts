import { useEffect, useRef, useState } from 'react'
import { fetchStats } from '../api/client'
import type { DetectionStats } from '../types/detection'

/**
 * Polls GET /stats every `intervalMs` while `enabled` is true (e.g. during
 * an active webcam session), and stops cleanly on unmount or when disabled.
 */
export function useDetectionStats(enabled: boolean, intervalMs = 1000) {
  const [stats, setStats] = useState<DetectionStats | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    const poll = async () => {
      try {
        const res = await fetchStats()
        if (res.success) setStats(res.stats)
      } catch (err) {
        console.error('Failed to fetch stats', err)
      }
    }

    poll() // fire immediately, then on interval
    timerRef.current = window.setInterval(poll, intervalMs)

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [enabled, intervalMs])

  return stats
}
