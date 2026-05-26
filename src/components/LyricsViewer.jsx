import { useRef } from 'react'

export function LyricsViewer({ currentSong }) {
  const containerRef = useRef(null)

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <main ref={containerRef} className="flex-1 relative overflow-hidden bg-white min-w-0">
      {currentSong ? (
        <>
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 hover:bg-black/80 text-white text-xs font-semibold px-3.5 py-2 rounded-xl backdrop-blur-sm shadow-lg hover:-translate-y-0.5 transition-all active:translate-y-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
            </svg>
            Fullscreen
          </button>
          <iframe
            key={currentSong.url}
            src={currentSong.url}
            title={currentSong.title}
            className="w-full h-full"
          />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="text-center animate-fade-in-up">
            <span className="text-8xl block mb-5 opacity-30 animate-float">🎼</span>
            <h2 className="text-2xl font-bold text-slate-700 mb-2">Select a song to begin</h2>
            <p className="text-slate-400 text-sm">Choose from the library or search for your favourite</p>
          </div>
        </div>
      )}
    </main>
  )
}
