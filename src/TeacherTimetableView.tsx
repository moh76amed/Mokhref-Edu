import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']

const TIME_SLOTS = Array.from({ length: 36 }, (_, i) => {
  const startMinutes = 8 * 60 + i * 15
  const endMinutes = startMinutes + 15
  const fmt = (m: number) => {
    const h = Math.floor(m / 60).toString().padStart(2, '0')
    const min = (m % 60).toString().padStart(2, '0')
    return `${h}:${min}`
  }
  return { index: i + 1, start: fmt(startMinutes), end: fmt(endMinutes) }
})

type Entry = {
  id: number
  day_of_week: number
  start_slot: number
  duration_slots: number
  room: string | null
  class_id: number
  classes: { name: string } | null
  subjects: { name: string; color: string } | null
}

type Teacher = {
  id: string
  first_name: string
  last_name: string
}

export function TeacherTimetableView() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(false)

  // جلب الأساتذة
    useEffect(() => {
    async function loadTeachers() {
      const { data } = await supabase
        .from('teachers')
        .select('id, first_name, last_name')
        .eq('is_teacher', true)
        .order('last_name')
      setTeachers(data || [])
      if (data && data.length > 0) setSelectedTeacher(data[0].id)
    }
    loadTeachers()
  }, [])

  // جلب الحصص عند تغيير الأستاذ
  useEffect(() => {
    if (!selectedTeacher) return
    async function loadEntries() {
      setLoading(true)
      const { data } = await supabase
        .from('timetable_entries')
        .select('id, day_of_week, start_slot, duration_slots, room, class_id, classes(name), subjects(name, color)')
        .eq('teacher_id', selectedTeacher)
      setEntries((data as any) || [])
      setLoading(false)
    }
    loadEntries()
  }, [selectedTeacher])

  const getEntryAt = (day: number, slotIndex: number) => {
    return entries.find(e => e.day_of_week === day && e.start_slot === slotIndex)
  }

  const isCoveredByPrevious = (day: number, slotIndex: number) => {
    return entries.some(e =>
      e.day_of_week === day &&
      e.start_slot < slotIndex &&
      e.start_slot + e.duration_slots > slotIndex
    )
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial', direction: 'rtl' }}>
      <h1>توقيت الأستاذ</h1>

      <label>
        <strong>الأستاذ: </strong>
        <select
          value={selectedTeacher || ''}
          onChange={(e) => setSelectedTeacher(e.target.value)}
          style={{ padding: 6, fontSize: 16, marginBottom: 20 }}
        >
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.first_name} {t.last_name}
            </option>
          ))}
        </select>
      </label>

      {loading && <p>جاري التحميل...</p>}

      {teachers.length === 0 && !loading && (
        <p style={{ color: '#888', marginTop: 20 }}>لا يوجد أساتذة بعد.</p>
      )}

      {teachers.length > 0 && (
        <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 10 }}>
          <thead>
            <tr>
              <th style={thStyle}>الوقت</th>
              {DAYS.map((d) => (
                <th key={d} style={thStyle}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((slot) => (
              <tr key={slot.index}>
                <td style={timeCellStyle}>
                  {slot.start} - {slot.end}
                </td>
                {DAYS.map((_, dayIdx) => {
                  if (isCoveredByPrevious(dayIdx, slot.index)) return null

                  const entry = getEntryAt(dayIdx, slot.index)
                  if (entry) {
                    return (
                      <td
                        key={dayIdx}
                        rowSpan={entry.duration_slots}
                        style={{
                          ...cellStyle,
                          background: entry.subjects?.color || '#ddd',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      >
                        <div>{entry.classes?.name || '—'}</div>
                        <div style={{ fontSize: 11, opacity: 0.9 }}>
                          {entry.subjects?.name}
                        </div>
                      </td>
                    )
                  }
                  return <td key={dayIdx} style={cellStyle}></td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  border: '1px solid #999',
  padding: 8,
  background: '#333',
  color: 'white'
}
const cellStyle: React.CSSProperties = {
  border: '1px solid #ccc',
  padding: 4,
  textAlign: 'center',
  height: 22,
  fontSize: 13
}
const timeCellStyle: React.CSSProperties = {
  ...cellStyle,
  background: '#f0f0f0',
  fontSize: 11,
  whiteSpace: 'nowrap'
}