import { SongItem } from './SongItem'

export function Sidebar({ songs, recents, favorites, currentSongId, searchTerm, onSearch, onSongClick, onToggleFavorite, onAddSong, loading }) {
  return (
    <aside className="w-72 xl:w-80 flex-shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col">
      {/* Search */}
      <div className="p-4 border-b border-slate-100">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search songs..."
            className="w-full pl-9 pr-9 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)] transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => onSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {/* Recents */}
        {!searchTerm && recents.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-1.5 px-1 py-1 mb-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-[0.62rem] font-bold uppercase tracking-widest text-slate-400">Recently Opened</span>
            </div>
            <div className="space-y-1">
              {recents.map((song) => (
                <SongItem
                  key={`r-${song.id}`}
                  song={song}
                  isActive={song.id === currentSongId}
                  isFavorite={favorites.has(song.id)}
                  compact
                  showFavorite={false}
                  onClick={() => onSongClick(song)}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
            <div className="mt-3 mb-1 border-b border-slate-200" />
          </div>
        )}

        {/* All Songs */}
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm animate-pulse">Loading songs…</div>
        ) : songs.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">No songs found</div>
        ) : (
          songs.map((song) => (
            <SongItem
              key={song.id}
              song={song}
              isActive={song.id === currentSongId}
              isFavorite={favorites.has(song.id)}
              onClick={() => onSongClick(song)}
              onToggleFavorite={onToggleFavorite}
            />
          ))
        )}
      </div>

      {/* Add button */}
      <div className="p-3 border-t border-slate-200 flex-shrink-0">
        <button
          onClick={onAddSong}
          className="w-full py-2.5 bg-brand text-white font-semibold text-sm rounded-xl hover:-translate-y-0.5 hover:shadow-md transition-all active:translate-y-0"
        >
          + Add New Song
        </button>
      </div>
    </aside>
  )
}
