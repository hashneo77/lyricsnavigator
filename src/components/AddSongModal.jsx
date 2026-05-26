import { useState } from 'react'

export function AddSongModal({ onClose, onAdd }) {
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onAdd({ title, artist, url })
      onClose()
    } catch (err) {
      alert('Error adding song: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-5 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Add New Song</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all hover:rotate-90 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-7 pt-5 pb-7 space-y-4">
          {[
            { label: 'Song Title', value: title, setter: setTitle, type: 'text', placeholder: 'e.g. Amazing Grace' },
            { label: 'Artist', value: artist, setter: setArtist, type: 'text', placeholder: 'e.g. Hymn' },
            { label: 'Lyrics URL', value: url, setter: setUrl, type: 'url', placeholder: 'https://…' },
          ].map(({ label, value, setter, type, placeholder }) => (
            <div key={label}>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
              <input
                type={type}
                value={value}
                onChange={(e) => setter(e.target.value)}
                required
                placeholder={placeholder}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)] transition-all"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-brand text-white font-semibold rounded-xl hover:-translate-y-0.5 hover:shadow-lg transition-all active:translate-y-0 disabled:opacity-60 mt-1"
          >
            {saving ? 'Adding…' : 'Add Song'}
          </button>
        </form>
      </div>
    </div>
  )
}
