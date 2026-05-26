import { useState, useEffect } from 'react'
import { ref, onValue, set } from 'firebase/database'
import { db } from '../lib/firebase'

export function useFavorites() {
  const [favorites, setFavorites] = useState(new Set())

  useEffect(() => {
    return onValue(ref(db, 'sharedFavorites'), (snap) => {
      const data = snap.val() || {}
      setFavorites(new Set(Object.keys(data).filter((k) => data[k])))
    })
  }, [])

  const toggleFavorite = (songId) => {
    set(ref(db, `sharedFavorites/${songId}`), !favorites.has(songId))
  }

  return { favorites, toggleFavorite }
}
