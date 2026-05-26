import { useState, useEffect, useRef } from 'react'
import { ref, set, onValue, remove, onDisconnect } from 'firebase/database'
import { db } from '../lib/firebase'

const SESSION_DURATION = 6 * 60 * 60 * 1000

function getDeviceId() {
  let id = localStorage.getItem('deviceId')
  if (!id) {
    id = Date.now().toString(36) + Math.random().toString(36).slice(2)
    localStorage.setItem('deviceId', id)
  }
  return id
}

export function useSession() {
  const [sessionCode, setSessionCode] = useState(null)
  const [isCreator, setIsCreator] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)
  const [sessionSong, setSessionSong] = useState(null)

  // Use refs so timeout callbacks always see current values
  const r = useRef({ code: null, creator: false, unsub: {}, expiry: null })

  const cleanup = () => {
    r.current.unsub.song?.()
    r.current.unsub.participants?.()
    r.current.unsub = {}
    clearTimeout(r.current.expiry)
    r.current.expiry = null
  }

  const resetState = () => {
    const code = r.current.code
    cleanup()
    if (code) remove(ref(db, `sessions/${code}/participants/${getDeviceId()}`))
    r.current.code = null
    r.current.creator = false
    localStorage.removeItem('sessionCode')
    localStorage.removeItem('sessionCreatedAt')
    localStorage.removeItem('sessionRole')
    setSessionCode(null)
    setIsCreator(false)
    setParticipantCount(0)
    setSessionSong(null)
  }

  const attachListeners = (code) => {
    cleanup()
    r.current.unsub.song = onValue(ref(db, `sessions/${code}/currentSong`), (snap) => {
      if (snap.val()) setSessionSong(snap.val())
    })
    r.current.unsub.participants = onValue(ref(db, `sessions/${code}/participants`), (snap) => {
      setParticipantCount(snap.val() ? Object.keys(snap.val()).length : 0)
    })
  }

  const activate = (code, creator, createdAt) => {
    r.current.code = code
    r.current.creator = creator
    setSessionCode(code)
    setIsCreator(creator)
    localStorage.setItem('sessionCode', code)
    localStorage.setItem('sessionCreatedAt', String(createdAt))
    localStorage.setItem('sessionRole', creator ? 'creator' : 'joiner')

    const pRef = ref(db, `sessions/${code}/participants/${getDeviceId()}`)
    set(pRef, { joinedAt: Date.now() })
    onDisconnect(pRef).remove()

    attachListeners(code)

    const remaining = SESSION_DURATION - (Date.now() - createdAt)
    if (remaining > 0) {
      r.current.expiry = setTimeout(() => {
        if (r.current.creator && r.current.code) remove(ref(db, `sessions/${r.current.code}`))
        resetState()
      }, remaining)
    }
  }

  // Restore session on mount
  useEffect(() => {
    const code = localStorage.getItem('sessionCode')
    const createdAt = parseInt(localStorage.getItem('sessionCreatedAt') || '0')
    const role = localStorage.getItem('sessionRole')
    if (!code || !createdAt || Date.now() - createdAt > SESSION_DURATION) return

    onValue(ref(db, `sessions/${code}`), (snap) => {
      if (!snap.val()) { resetState(); return }
      activate(code, role === 'creator', createdAt)
    }, { onlyOnce: true })

    return cleanup
  }, [])

  const createSession = async () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString()
    const now = Date.now()
    await set(ref(db, `sessions/${code}`), { createdAt: now, expiresAt: now + SESSION_DURATION })
    activate(code, true, now)
  }

  const joinSession = (code) =>
    new Promise((resolve, reject) => {
      onValue(ref(db, `sessions/${code}`), (snap) => {
        const data = snap.val()
        if (!data) { reject(new Error('Session not found. Check the code.')); return }
        if (data.expiresAt && Date.now() > data.expiresAt) {
          remove(ref(db, `sessions/${code}`))
          reject(new Error('Session has expired.'))
          return
        }
        activate(code, false, data.createdAt)
        resolve()
      }, { onlyOnce: true })
    })

  const endSession = () => {
    const code = r.current.code
    cleanup()
    if (code) remove(ref(db, `sessions/${code}`))
    resetState()
  }

  const leaveSession = () => resetState()

  const syncSong = (url, songId) => {
    if (!r.current.code) return
    set(ref(db, `sessions/${r.current.code}/currentSong`), { url, songId, timestamp: Date.now() })
  }

  return { sessionCode, isCreator, participantCount, sessionSong, createSession, joinSession, endSession, leaveSession, syncSong }
}
