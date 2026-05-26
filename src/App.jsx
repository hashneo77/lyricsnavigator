import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { LyricsViewer } from './components/LyricsViewer'
import { AddSongModal } from './components/AddSongModal'
import { useSongs } from './hooks/useSongs'
import { useFavorites } from './hooks/useFavorites'
import { useRecents } from './hooks/useRecents'
import { useSession } from './hooks/useSession'

export default function App() {
  const [currentSong, setCurrentSong] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const { songs, loading, addSong } = useSongs()
  const { favorites, toggleFavorite } = useFavorites()
  const { recents, addToRecents } = useRecents()
  const session = useSession()

  // Ref so session effect always sees the latest currentSong without re-subscribing
  const currentSongIdRef = useRef(null)
  useEffect(() => { currentSongIdRef.current = currentSong?.id }, [currentSong?.id])

  // Load a song (user-initiated — syncs to session)
  const handleSongSelect = useCallback((song) => {
    setCurrentSong(song)
    addToRecents({ id: song.id, url: song.url, title: song.title, artist: song.artist })
    session.syncSong(song.url, song.id)
  }, [session, addToRecents])

  // When a remote session song arrives, load it without syncing back
  useEffect(() => {
    if (!session.sessionSong) return
    const { url, songId } = session.sessionSong
    if (songId === currentSongIdRef.current) return
    const song = songs.find((s) => s.id === songId)
    const meta = song ?? { id: songId, url, title: '', artist: '' }
    setCurrentSong({ ...meta, url })
    if (song) addToRecents({ id: song.id, url, title: song.title, artist: song.artist })
  }, [session.sessionSong, songs, addToRecents])

  // Sorted + filtered songs
  const displayedSongs = useMemo(() => {
    const sorted = [...songs].sort((a, b) => {
      const af = favorites.has(a.id), bf = favorites.has(b.id)
      if (af && !bf) return -1
      if (!af && bf) return 1
      return a.title.localeCompare(b.title)
    })
    if (!searchTerm.trim()) return sorted
    const t = searchTerm.toLowerCase()
    return sorted.filter((s) =>
      s.title.toLowerCase().includes(t) || s.artist.toLowerCase().includes(t)
    )
  }, [songs, favorites, searchTerm])

  return (
    <div className="h-screen overflow-hidden bg-brand p-3 sm:p-5 flex flex-col">
      <div className="flex-1 min-h-0 max-w-[1400px] w-full mx-auto bg-white rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
        <Header session={session} />
        <div className="flex flex-1 min-h-0">
          <Sidebar
            songs={displayedSongs}
            recents={searchTerm ? [] : recents}
            favorites={favorites}
            currentSongId={currentSong?.id}
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
            onSongClick={handleSongSelect}
            onToggleFavorite={toggleFavorite}
            onAddSong={() => setShowAddModal(true)}
            loading={loading}
          />
          <LyricsViewer currentSong={currentSong} />
        </div>
      </div>

      {showAddModal && (
        <AddSongModal onClose={() => setShowAddModal(false)} onAdd={addSong} />
      )}
    </div>
  )
}
