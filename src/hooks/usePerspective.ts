import { useState, useCallback } from 'react'
import { perspectiveWarp } from '../utils/perspectiveWarp'
import type { Corners } from '../types'

export function usePerspective() {
  const [warping, setWarping] = useState(false)

  const warp = useCallback(
    async (rawDataUrl: string, corners: Corners): Promise<string> => {
      setWarping(true)
      try {
        return await perspectiveWarp(rawDataUrl, corners)
      } finally {
        setWarping(false)
      }
    },
    [],
  )

  return { warp, warping }
}
