/**
 * useImageInference.ts
 * ====================
 * Encapsulates all state and side-effects for image-mode detection.
 *
 * Key behaviour:
 *  - Auto-fires inference whenever `file`, `selectedClasses`, `confidence`, or `scopeMode` changes.
 *  - 400 ms debounce prevents rapid filter clicks from hammering the backend.
 *  - AbortController cancels any in-flight request before sending a new one.
 *  - `scopeMode === 'detect-all'`  → sends NO class filter (YOLO detects everything natively)
 *  - `scopeMode === 'detect-selected'` → sends selectedClasses to backend (YOLO native classes= param)
 *  - On error: restores previous result and exposes a `retryFn` callback.
 *  - Exposes `isInferring` (true during request) so panels can show loading UI.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { detectImage } from '../api/client'
import type { ImageDetectionResponse, TrackedObject, DetectionScopeMode } from '../types/detection'

interface UseImageInferenceOptions {
  file: File | null
  selectedClasses: string[]   // used only when scopeMode === 'detect-selected'
  confidence: number
  scopeMode: DetectionScopeMode
  enabled?: boolean           // when false, inference never fires (e.g. no file yet)
  onResult?: (res: ImageDetectionResponse) => void
}

interface UseImageInferenceReturn {
  rawResult: ImageDetectionResponse | null
  filteredObjects: TrackedObject[]
  isInferring: boolean
  isError: boolean
  errorMessage: string | null
  resetResult: () => void
  retryFn: () => void
  cancelFn: () => void
}

export function useImageInference({
  file,
  selectedClasses,
  confidence,
  scopeMode,
  enabled = true,
  onResult,
}: UseImageInferenceOptions): UseImageInferenceReturn {
  const [rawResult, setRawResult] = useState<ImageDetectionResponse | null>(null)
  const [isInferring, setIsInferring] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Derived filtered objects based on rawResult + scopeMode + selectedClasses
  const filteredObjects = useMemo(() => {
    if (!rawResult) return []
    const allObjects = rawResult.result.objects
    if (scopeMode === 'detect-selected' && selectedClasses.length > 0) {
      const selectedLower = selectedClasses.map((c) => c.toLowerCase())
      return allObjects.filter((obj) => selectedLower.includes(obj.class_name.toLowerCase()))
    }
    return allObjects
  }, [rawResult, scopeMode, selectedClasses])

  // Keeps the last successful result so we can restore it on cancel or error
  const previousResultRef = useRef<ImageDetectionResponse | null>(null)

  // Holds the current AbortController so we can cancel in-flight requests
  const abortRef = useRef<AbortController | null>(null)
  // Holds the debounce timer
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetResult = useCallback(() => {
    setRawResult(null)
    previousResultRef.current = null
    setIsError(false)
    setErrorMessage(null)
  }, [])

  // Core inference runner — extracted so retryFn can call it immediately
  const runInference = useCallback(async () => {
    if (!file || !enabled) return

    // Cancel any running request
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsInferring(true)
    setIsError(false)
    setErrorMessage(null)

    try {
      // 'detect-all': send undefined → backend detects all YOLO classes natively
      // 'detect-selected': send selectedClasses → backend uses YOLO classes= filter
      const classesToSend =
        scopeMode === 'detect-selected' && selectedClasses.length > 0
          ? selectedClasses
          : undefined

      const res = await detectImage(file, confidence, classesToSend, controller.signal)

      if (controller.signal.aborted) return  // stale response — discard

      previousResultRef.current = res
      setRawResult(res)
      onResult?.(res)
      setIsError(false)
      setErrorMessage(null)
      toast.success(
        `Detection complete — ${res.result.objects.length} object(s) found.`,
        { id: 'image-inference' },
      )
    } catch (err: unknown) {
      if (axios.isCancel(err)) return
      if (err instanceof Error && (err.name === 'CanceledError' || err.name === 'AbortError')) return

      setIsError(true)
      const msg = err instanceof Error ? err.message : 'Inference request failed.'
      setErrorMessage(msg)

      console.error('[useImageInference]', err)
    } finally {
      if (!controller.signal.aborted) setIsInferring(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, selectedClasses, confidence, scopeMode, enabled])

  const retryFn = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    runInference()
  }, [runInference])

  const cancelFn = useCallback(() => {
    setIsError(false)
    setErrorMessage(null)
    if (previousResultRef.current) {
      setRawResult(previousResultRef.current)
    }
  }, [])

  useEffect(() => {
    // No file or disabled → clear results
    if (!file || !enabled) {
      resetResult()
      return
    }

    // Clear any pending debounce
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      runInference()
    }, 300)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, selectedClasses, confidence, scopeMode, enabled])

  return { rawResult, filteredObjects, isInferring, isError, errorMessage, resetResult, retryFn, cancelFn }
}
