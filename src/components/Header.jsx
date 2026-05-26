import { useState } from 'react'

export function Header({ session }) {
  const [codeInput, setCodeInput] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  const handleJoin = async () => {
    if (!/^\d{4}$/.test(codeInput)) { setError('Enter a 4-digit code'); return }
    setJoining(true)
    setError('')
    try {
      await session.joinSession(codeInput)
      setCodeInput('')
    } catch (e) {
      setError(e.message)
    } finally {
      setJoining(false)
    }
  }

  return (
    <header className="bg-brand px-6 sm:px-10 py-4 sm:py-5 flex-shrink-0 relative overflow-hidden">
      {/* Subtle radial highlight */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_60%)] pointer-events-none" />

      <div className="relative flex items-center gap-3 flex-wrap">
        {session.sessionCode ? (
          <div className="flex items-center gap-3 bg-white/15 border border-white/25 rounded-full px-4 py-2 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            <span className="text-white font-bold tracking-[0.2em] text-sm">{session.sessionCode}</span>
            <div className="flex items-center gap-1.5 text-white/80 text-xs font-semibold">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {session.participantCount}
            </div>
            {session.isCreator ? (
              <button onClick={session.endSession} className="text-white/90 text-xs font-semibold bg-white/20 hover:bg-white/35 px-3 py-1 rounded-full transition-colors">
                End
              </button>
            ) : (
              <button onClick={session.leaveSession} className="text-white/90 text-xs font-semibold bg-white/20 hover:bg-white/35 px-3 py-1 rounded-full transition-colors">
                Leave
              </button>
            )}
          </div>
        ) : (
          <>
            <button
              onClick={session.createSession}
              className="flex items-center gap-2 bg-white text-indigo-600 font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm hover:bg-indigo-50 hover:-translate-y-0.5 hover:shadow-md transition-all active:translate-y-0"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create
            </button>

            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={4}
                value={codeInput}
                onChange={(e) => { setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 4)); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                placeholder="Code"
                className="w-20 text-center font-bold tracking-[0.2em] text-sm bg-white/20 border border-white/30 text-white placeholder:text-white/50 rounded-xl px-3 py-2.5 outline-none focus:bg-white/30 focus:border-white/60 transition-all"
              />
              <button
                onClick={handleJoin}
                disabled={joining}
                className="flex items-center gap-2 bg-white/20 border border-white/40 text-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-white/30 hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-50"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                Join
              </button>
            </div>
            {error && <span className="text-red-200 text-xs font-medium">{error}</span>}
          </>
        )}
      </div>
    </header>
  )
}
