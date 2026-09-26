import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']

type Entry = {
  id: number
  day_of_week: number
  start_slot: number
  duration_slots: number
  room: string | null
  is_break: boolean | null
  subjects: { name: string; color: string } | null
  teachers: { first_name: string; last_name: string } | null
}

type ClassRow = {
  id: number
  name: string
  levels: { name: string } | null
}

// 36 خانة زمنية، كل واحدة 15 دقيقة، من 08:00 إلى 17:00
const TIME_SLOTS = Array.from({ length: 36 }, (_, i) => {
  const m = 8 * 60 + i * 15
  const fmt = (x: number) =>
    `${Math.floor(x / 60).toString().padStart(2, '0')}:${(x % 60).toString().padStart(2, '0')}`
  return {
    index: i + 1,
    label: fmt(m),
  }
})

export function PrintTimetableView() {
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [selectedClass, setSelectedClass] = useState<number | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data: classesData } = await supabase
        .from('classes')
        .select('id, name, levels(name)')
        .order('id')
      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single()
      setClasses((classesData as any) || [])
      setSettings(settingsData)
      if (classesData && classesData.length > 0) setSelectedClass(classesData[0].id)
      setLoading(false)
    }
    loadData()
  }, [])

  useEffect(() => {
    if (!selectedClass) return
    async function loadEntries() {
      const { data } = await supabase
        .from('timetable_entries')
        .select('id, day_of_week, start_slot, duration_slots, room, is_break, subjects(name, color), teachers(first_name, last_name)')
        .eq('class_id', selectedClass)
      setEntries((data as any) || [])
    }
    loadEntries()
  }, [selectedClass])

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

  const selectedClassObj = classes.find(c => c.id === selectedClass)

  if (loading) return <p style={{ padding: 20 }}>جاري التحميل...</p>

  return (
    <div style={{ padding: 20, fontFamily: 'Arial', direction: 'rtl', background: '#f5f5f5' }}>
      {/* شريط التحكم (لا يُطبع) */}
      <div className="no-print" style={{ marginBottom: 20, display: 'flex', gap: 15, alignItems: 'center' }}>
        <label>
          <strong>القسم: </strong>
          <select
            value={selectedClass || ''}
            onChange={(e) => setSelectedClass(Number(e.target.value))}
            style={{ padding: 8, fontSize: 16 }}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.levels?.name ? `— ${c.levels.name}` : ''}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={() => window.print()}
          style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 16,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          🖨️ طباعة
        </button>
      </div>

      {/* منطقة الطباعة */}
      <div className="print-area" style={pageStyle}>
        {/* الرأس: 3 أعمدة */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
          {/* اليمين: الوزارة والمديرية */}
          <div style={{ textAlign: 'right', fontSize: 11, lineHeight: 1.6, flex: 1 }}>
            <div style={{ fontWeight: 'bold' }}>وزارة التربية الوطنية</div>
            <div>{settings?.direction || 'مديرية التربية لولاية ...'}</div>
          </div>

          {/* الوسط: الجمهورية */}
          <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 'bold', flex: 1, paddingTop: 4 }}>
            الجمهورية الجزائرية الديمقراطية الشعبية
          </div>

          {/* اليسار: المدرسة والسنة */}
          <div style={{ textAlign: 'left', fontSize: 11, lineHeight: 1.6, flex: 1 }}>
            <div style={{ fontWeight: 'bold' }}>{settings?.school_name || 'اسم المدرسة'}</div>
            <div>السنة الدراسية: {settings?.academic_year || '...'}</div>
          </div>
        </div>

        {/* العنوان */}
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 'bold', textDecoration: 'underline' }}>
            التوقيت الأسبوعي لـ: {selectedClassObj?.levels?.name || ''} {selectedClassObj?.name?.split(' ').pop() || '...'}
          </div>
        </div>

        {/* الجدول */}
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={cornerCellStyle}></th>
              {TIME_SLOTS.map((slot) => (
                <th key={slot.index} style={timeHeaderStyle}>
                  <span style={verticalTextStyle}>{slot.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((dayName, dayIdx) => (
              <tr key={dayIdx}>
                <td style={dayCellStyle}>{dayName}</td>
                {TIME_SLOTS.map((slot) => {
                  if (isCoveredByPrevious(dayIdx, slot.index)) return null
                  const entry = getEntryAt(dayIdx, slot.index)
                  if (entry) {
                    return (
                      <td
                        key={slot.index}
                        colSpan={entry.duration_slots}
                        style={entryCellStyle}
                      >
                        {entry.is_break ? 'غداء' : entry.subjects?.name || ''}
                      </td>
                    )
                  }
                  return <td key={slot.index} style={emptyCellStyle}></td>
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* التذييل */}
        <div style={{ marginTop: 15, fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
          <div>مدير المؤسسة: {settings?.director_name || '...'}</div>
          <div>المفتشية: {settings?.inspectorate || '...'}</div>
        </div>
      </div>
    </div>
  )
}

// ==================== الأنماط ====================
const pageStyle: React.CSSProperties = {
  background: 'white',
  padding: '15mm 10mm',
  maxWidth: 1100,
  margin: '0 auto',
  border: '1px solid #ddd',
  boxSizing: 'border-box'
}

const tableStyle: React.CSSProperties = {
  borderCollapse: 'collapse',
  width: '100%',
  tableLayout: 'fixed',
  fontSize: 10
}

const cornerCellStyle: React.CSSProperties = {
  border: '1px solid #000',
  width: 55,
  background: '#f0f0f0'
}

const timeHeaderStyle: React.CSSProperties = {
  border: '1px solid #000',
  background: '#f0f0f0',
  height: 45,
  padding: 0,
  verticalAlign: 'bottom',
  position: 'relative'
}

const verticalTextStyle: React.CSSProperties = {
  display: 'inline-block',
  transform: 'rotate(-90deg)',
  transformOrigin: 'center',
  whiteSpace: 'nowrap',
  fontSize: 9,
  fontWeight: 'bold',
  paddingBottom: 2
}

const dayCellStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '2px 4px',
  fontSize: 11,
  fontWeight: 'bold',
  textAlign: 'center',
  background: '#f0f0f0',
  width: 55
}

const entryCellStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '2px 3px',
  fontSize: 10,
  textAlign: 'center',
  background: '#f9f9f9',
  verticalAlign: 'middle',
  fontWeight: 'bold',
  height: 30
}

const emptyCellStyle: React.CSSProperties = {
  border: '1px solid #000',
  height: 30
}