export function SongItem({ song, isActive, isFavorite, compact = false, showFavorite = true, onClick, onToggleFavorite }) {
  return (
    <div
      onClick={onClick}
      className={[
        'group relative flex items-center gap-2 rounded-xl cursor-pointer select-none transition-all duration-200',
        compact ? 'px-3 py-2' : 'px-3 py-3',
        isActive
          ? 'bg-brand text-white shadow-lg translate-x-1.5'
          : 'bg-white border-2 border-transparent hover:border-indigo-300 hover:shadow-md hover:translate-x-1.5',
      ].join(' ')}
    >
      {/* Left accent bar on hover (non-active) */}
      {!isActive && (
        <div className="absolute left-0 top-0 h-full w-1 bg-brand rounded-l-xl scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />
      )}

      <div className="flex-1 min-w-0">
        <p className={[
          'font-semibold truncate leading-tight',
          compact ? 'text-[0.82rem]' : 'text-[0.87rem]',
          isActive ? 'text-white' : 'text-slate-800',
        ].join(' ')}>
          {song.title}
        </p>
        <p className={[
          'truncate mt-0.5',
          compact ? 'text-[0.72rem]' : 'text-[0.76rem]',
          isActive ? 'text-white/80' : 'text-slate-500',
        ].join(' ')}>
          {song.artist}
        </p>
      </div>

      {showFavorite && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(song.id) }}
          className={[
            'flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-all hover:scale-110 active:scale-95',
            isActive ? 'hover:bg-white/20' : 'hover:bg-slate-100',
          ].join(' ')}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite
            ? <span className="animate-star-pop">⭐</span>
            : <span className={isActive ? 'text-white/40' : 'text-slate-300'}>☆</span>
          }
        </button>
      )}
    </div>
  )
}
