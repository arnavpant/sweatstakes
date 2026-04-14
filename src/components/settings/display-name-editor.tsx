'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { updateDisplayNameAction } from '@/lib/actions/profile'

interface Props {
  currentName: string
}

export function DisplayNameEditor({ currentName }: Props) {
  const [name, setName] = useState(currentName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const trimmed = name.trim()
  const dirty = trimmed !== currentName.trim() && trimmed.length > 0

  async function handleSave() {
    if (!dirty) return
    setSaving(true)
    setError(null)
    const res = await updateDisplayNameAction(name)
    setSaving(false)
    if ('error' in res) {
      setError(res.error ?? 'Failed to save name.')
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-on-surface">Display name</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 bg-surface-container-high text-on-surface rounded-lg px-3 py-2 text-base"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="bg-secondary text-on-secondary rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50 inline-flex items-center justify-center min-w-[72px]"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
        </button>
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
}
