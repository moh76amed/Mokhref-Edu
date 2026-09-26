import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

type Settings = {
  id: number
  school_name: string | null
  wilaya: string | null
  commune: string | null
  direction: string | null
  academic_year: string | null
  inspectorate: string | null
  director_name: string | null
}

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single()
      if (error) setError(error.message)
      setSettings(data)
      setLoading(false)
    }
    load()
  }, [])

  function updateField(field: keyof Settings, value: string) {
    if (!settings) return
    setSettings({ ...settings, [field]: value })
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!settings) return
    setError('')
    setSaving(true)
    const { error } = await supabase
      .from('settings')
      .update({
        school_name: settings.school_name,
        wilaya: settings.wilaya,
        commune: settings.commune,
        direction: settings.direction,
        academic_year: settings.academic_year,
        inspectorate: settings.inspectorate,
        director_name: settings.director_name
      })
      .eq('id', 1)
    setSaving(false)
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  if (loading) return <p style={{ padding: 20 }}>جاري التحميل...</p>
  if (!settings) return <p style={{ padding: 20 }}>لا توجد إعدادات.</p>

  return (
    <div style={{ padding: 20, fontFamily: 'Arial', direction: 'rtl', maxWidth: 700 }}>
      <h1>إعدادات المؤسسة</h1>

      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>
          اسم المدرسة
          <input
            type="text"
            value={settings.school_name || ''}
            onChange={(e) => updateField('school_name', e.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          الولاية
          <input
            type="text"
            value={settings.wilaya || ''}
            onChange={(e) => updateField('wilaya', e.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          البلدية
          <input
            type="text"
            value={settings.commune || ''}
            onChange={(e) => updateField('commune', e.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          مديرية التربية
          <input
            type="text"
            value={settings.direction || ''}
            onChange={(e) => updateField('direction', e.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          المفتشية
          <input
            type="text"
            value={settings.inspectorate || ''}
            onChange={(e) => updateField('inspectorate', e.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          السنة الدراسية
          <input
            type="text"
            value={settings.academic_year || ''}
            onChange={(e) => updateField('academic_year', e.target.value)}
            style={inputStyle}
            placeholder="مثال: 2025/2026"
          />
        </label>

        <label style={labelStyle}>
          اسم المدير
          <input
            type="text"
            value={settings.director_name || ''}
            onChange={(e) => updateField('director_name', e.target.value)}
            style={inputStyle}
          />
        </label>

        {error && <div style={errorStyle}>{error}</div>}
        {success && <div style={successStyle}>✅ تم حفظ الإعدادات بنجاح</div>}

        <button type="submit" disabled={saving} style={primaryBtn}>
          {saving ? '...' : 'حفظ الإعدادات'}
        </button>
      </form>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 14,
  fontWeight: 'bold',
  fontSize: 14
}
const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: 10,
  marginTop: 6,
  fontSize: 15,
  border: '1px solid #ccc',
  borderRadius: 6,
  boxSizing: 'border-box',
  fontFamily: 'inherit'
}
const errorStyle: React.CSSProperties = {
  background: '#ffe0e0',
  color: '#900',
  padding: 10,
  borderRadius: 4,
  fontSize: 13,
  marginBottom: 10
}
const successStyle: React.CSSProperties = {
  background: '#dcfce7',
  color: '#166534',
  padding: 10,
  borderRadius: 4,
  fontSize: 14,
  marginBottom: 10
}
const primaryBtn: React.CSSProperties = {
  background: '#007bff',
  color: 'white',
  border: 'none',
  padding: '12px 24px',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 15,
  fontWeight: 'bold'
}