import { useState, useEffect } from 'react'
import { ref, onValue, push, set } from 'firebase/database'
import { db } from '../lib/firebase'

export function useSongs() {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onValue(ref(db, 'songs'), (snap) => {
      const data = snap.val()
      setSongs(data ? Object.entries(data).map(([id, s]) => ({ id, ...s })) : [])
      setLoading(false)
    })
  }, [])

  const addSong = async ({ title, artist, url }) => {
    await push(ref(db, 'songs'), { title, artist, url, addedAt: Date.now() })
  }

  return { songs, loading, addSong }
}
