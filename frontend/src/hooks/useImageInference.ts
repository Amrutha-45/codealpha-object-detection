/**
 * useImageInference.ts
 * ====================
 * Encapsulates all state and side-effects for image-mode detection.
 *
 * Key features:
 *  - Auto-fires inference whenever `file`, `selectedClasses`, `confidence`, or `scopeMode` changes.
 *  - Exposes `runInference` directly so UI buttons ("Run Image Inference") can trigger it on demand.
 *  - 250 ms debounce prevents rapid filter clicks from hammering the backend.
 *  - AbortController cancels any in-flight request before sending a new one.
 *  - `scopeMode === 'detect-all'` → sends NO class filter (YOLO detects everything natively)
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
  runInference: () => Promise<void>
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

  // Stable references for in-flight tracking
  const previousResultRef = useRef<ImageDetectionResponse | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

  // Keep latest params in refs to avoid stale closures in debounced / async runners
  const latestParamsRef = useRef({
    file,
    selectedClasses,
    confidence,
    scopeMode,
    enabled,
  })
  latestParamsRef.current = {
    file,
    selectedClasses,
    confidence,
    scopeMode,
    enabled,
  }

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

  const resetResult = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setRawResult(null)
    previousResultRef.current = null
    setIsError(false)
    setErrorMessage(null)
    setIsInferring(false)
  }, [])

  // Core inference runner
  const runInference = useCallback(async () => {
    const { file: currentFile, selectedClasses: currentClasses, confidence: currentConf, scopeMode: currentMode, enabled: isEnabled } = latestParamsRef.current
    if (!currentFile || !isEnabled) return

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
        currentMode === 'detect-selected' && currentClasses.length > 0
          ? currentClasses
          : undefined

      const res = await detectImage(currentFile, currentConf, classesToSend, controller.signal)

      if (controller.signal.aborted) return  // stale response — discard

      previousResultRef.current = res
      setRawResult(res)
      onResultRef.current?.(res)
      setIsError(false)
      setErrorMessage(null)
      
      const count = res.result.objects.length
      const filterLabel = classesToSend ? classesToSend.join(', ') : 'All Classes'
      toast.success(
        `Detection complete — ${count} object(s) found [${filterLabel}].`,
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
  }, [])

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

  // Auto-run inference with debounce whenever inputs change
  useEffect(() => {
    if (!file || !enabled) {
      resetResult()
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      runInference()
    }, 250)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [file, selectedClasses, confidence, scopeMode, enabled, runInference, resetResult])

  return {
    rawResult,
    filteredObjects,
    isInferring,
    isError,
    errorMessage,
    resetResult,
    runInference,
    retryFn,
    cancelFn,
  }
}

