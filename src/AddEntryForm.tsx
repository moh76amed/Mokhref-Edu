import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']

const TIME_SLOTS = Array.from({ length: 36 }, (_, i) => {
  const startMinutes = 8 * 60 + i * 15
  const fmt = (m: number) => {
    const h = Math.floor(m / 60).toString().padStart(2, '0')
    const min = (m % 60).toString().padStart(2, '0')
    return `${h}:${min}`
  }
  return { index: i + 1, label: `${fmt(startMinutes)} - ${fmt(startMinutes + 15)}` }
})

type Props = {
  classId: number
  onSaved: () => void
  onCancel: () => void
}

export function AddEntryForm({ classId, onSaved, onCancel }: Props) {
  const [subjects, setSubjects] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [subjectId, setSubjectId] = useState<number | null>(null)
  const [teacherId, setTeacherId] = useState<string>('')
  const [day, setDay] = useState<number>(0)
  const [startSlot, setStartSlot] = useState<number>(1)
  const [duration, setDuration] = useState<number>(3)
  const [room, setRoom] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [saving, setSaving] = useState<boolean>(false)

  useEffect(() => {
    async function load() {
      const { data: s } = await supabase.from('subjects').select('*').order('id')
      const { data: t } = await supabase.from('teachers').select('*').order('last_name')
      setSubjects(s || [])
      setTeachers(t || [])
      if (s && s.length > 0) setSubjectId(s[0].id)
      if (t && t.length > 0) setTeacherId(t[0].id)
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!subjectId || !teacherId) {
      setError('يرجى اختيار المادة والأستاذ')
      return
    }
    setSaving(true)
    const { error: insertError } = await supabase.from('timetable_entries').insert({
      teacher_id: teacherId,
      class_id: classId,
      subject_id: subjectId,
      day_of_week: day,
      start_slot: startSlot,
      duration_slots: duration,
      room: room || null
    })
    setSaving(false)
    if (insertError) {
      setError(insertError.message)
    } else {
      onSaved()
    }
  }

  return (
    <div style={overlayStyle}>
      <form onSubmit={handleSubmit} style={modalStyle}>
        <h2 style={{ marginTop: 0 }}>إضافة حصة</h2>

        <label style={labelStyle}>
          المادة
          <select value={subjectId || ''} onChange={(e) => setSubjectId(Number(e.target.value))} style={inputStyle}>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>

        <label style={labelStyle}>
          الأستاذ
          <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} style={inputStyle}>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
            ))}
          </select>
        </label>

        <label style={labelStyle}>
          اليوم
          <select value={day} onChange={(e) => setDay(Number(e.target.value))} style={inputStyle}>
            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </label>

        <label style={labelStyle}>
          وقت البداية
          <select value={startSlot} onChange={(e) => setStartSlot(Number(e.target.value))} style={inputStyle}>
            {TIME_SLOTS.map((s) => <option key={s.index} value={s.index}>{s.label}</option>)}
          </select>
        </label>

        <label style={labelStyle}>
          المدة (بالوحدات 15 دقيقة)
          <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} style={inputStyle}>
            <option value={2}>وحدتان (30 دقيقة)</option>
            <option value={3}>ثلاث وحدات (45 دقيقة)</option>
            <option value={4}>أربع وحدات (60 دقيقة)</option>
            <option value={1}>وحدة واحدة (15 دقيقة)</option>
          </select>
        </label>

        <label style={labelStyle}>
          القاعة (اختياري)
          <input
            type="text"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            style={inputStyle}
          />
        </label>

        {error && <div style={errorStyle}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
          <button type="submit" disabled={saving} style={primaryBtn}>
            {saving ? '...' : 'حفظ'}
          </button>
          <button type="button" onClick={onCancel} style={secondaryBtn}>
            إلغاء
          </button>
        </div>
      </form>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
}
const modalStyle: React.CSSProperties = {
  background: 'white',
  padding: 25,
  borderRadius: 8,
  width: 420,
  maxWidth: '90%',
  direction: 'rtl',
  fontFamily: 'Arial'
}
const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 12,
  fontWeight: 'bold',
  fontSize: 14
}
const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: 8,
  marginTop: 4,
  fontSize: 15,
  border: '1px solid #ccc',
  borderRadius: 4
}
const errorStyle: React.CSSProperties = {
  background: '#ffe0e0',
  color: '#900',
  padding: 8,
  borderRadius: 4,
  fontSize: 13
}
const primaryBtn: React.CSSProperties = {
  background: '#007bff',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 15,
  fontWeight: 'bold'
}
const secondaryBtn: React.CSSProperties = {
  background: '#ddd',
  color: '#333',
  border: 'none',
  padding: '10px 20px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 15
}