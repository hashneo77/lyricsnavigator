import { useState, useCallback } from 'react'

const MAX = 8
const KEY = 'recentSongs'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export function useRecents() {
  const [recents, setRecents] = useState(load)

  const addToRecents = useCallback((song) => {
    setRecents((prev) => {
      const next = [song, ...prev.filter((r) => r.id !== song.id)].slice(0, MAX)
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { recents, addToRecents }
}
