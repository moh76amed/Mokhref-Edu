import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']

type Teacher = {
  id: string
  first_name: string
  last_name: string
}

type Entry = {
  id: number
  teacher_id: string
  day_of_week: number
  start_slot: number
  duration_slots: number
  classes: { name: string; levels: { name: string } | null } | null
  subjects: { code: string | null; color: string; name: string } | null
}

export function GeneralTable() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: t } = await supabase
        .from('teachers')
        .select('id, first_name, last_name')
        .eq('is_teacher', true)
        .order('last_name')
      const { data: e } = await supabase
        .from('timetable_entries')
        .select('id, teacher_id, day_of_week, start_slot, duration_slots, classes(name, levels(name)), subjects(code, color, name)')
      setTeachers(t || [])
      setEntries((e as any) || [])
      setLoading(false)
    }
    load()
  }, [])

  // حصص أستاذ في يوم معيّن
  function getEntriesFor(teacherId: string, day: number) {
    return entries
      .filter(e => e.teacher_id === teacherId && e.day_of_week === day)
      .sort((a, b) => a.start_slot - b.start_slot)
  }

  // ترميز القسم: "1-1" (السنة-القسم)
  function getClassCode(entry: Entry) {
    if (!entry.classes) return '?'
    const levelName = entry.classes.levels?.name || ''
    const levelMap: { [key: string]: string } = {
      'السنة التحضيرية': '0',
      'السنة الأولى': '1',
      'السنة الثانية': '2',
      'السنة الثالثة': '3',
      'السنة الرابعة': '4',
      'السنة الخامسة': '5'
    }
    const yearNum = levelMap[levelName] || '?'
    const classNum = entry.classes.name?.split(' ').pop() || '?'
    return `${yearNum}-${classNum}`
  }

  if (loading) return <p style={{ padding: 20 }}>جاري التحميل...</p>

  return (
    <div style={{ padding: 20, direction: 'rtl', fontFamily: 'Arial' }}>
      <h1 style={{ textAlign: 'center' }}>الجدول العام لتوزيع الأساتذة</h1>

      <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 20 }}>
        <thead>
          <tr>
            <th style={thStyle}>الأستاذ</th>
            {DAYS.map(d => (
              <th key={d} style={thStyle}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {teachers.map(teacher => (
            <tr key={teacher.id}>
              <td style={teacherCellStyle}>
                {teacher.first_name} {teacher.last_name}
              </td>
              {DAYS.map((_, dayIdx) => {
                const dayEntries = getEntriesFor(teacher.id, dayIdx)
                return (
                  <td key={dayIdx} style={cellStyle}>
                    {dayEntries.length === 0 ? (
                      <span style={{ color: '#ccc' }}>—</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {dayEntries.map(entry => (
                          <div
                            key={entry.id}
                            style={{
                              background: entry.subjects?.color || '#ddd',
                              color: 'white',
                              padding: '3px 5px',
                              borderRadius: 3,
                              fontSize: 11,
                              fontWeight: 'bold',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {getClassCode(entry)} {entry.subjects?.code || ''}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  border: '1px solid #999',
  padding: 8,
  background: '#333',
  color: 'white',
  textAlign: 'center',
  fontSize: 13
}

const teacherCellStyle: React.CSSProperties = {
  border: '1px solid #ccc',
  padding: '6px 10px',
  background: '#f0f0f0',
  fontWeight: 'bold',
  fontSize: 12,
  textAlign: 'right'
}

const cellStyle: React.CSSProperties = {
  border: '1px solid #ccc',
  padding: 4,
  textAlign: 'center',
  verticalAlign: 'top',
  minWidth: 100
}