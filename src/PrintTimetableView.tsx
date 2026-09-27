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

  // نُبقي فقط الخانات التي فيها حصة في أي يوم
  const visibleSlots = TIME_SLOTS.filter(slot =>
    entries.some(e =>
      e.start_slot <= slot.index &&
      slot.index < e.start_slot + e.duration_slots
    )
  )
  const selectedClassObj = classes.find(c => c.id === selectedClass)
  
  // نُقرر: هل الوقت أفقي أم عمودي؟
  // القاعدة: إذا كانت الأعمدة أقل من 10، اكتب أفقيًا
  const useHorizontalTime = visibleSlots.length < 10
  
  // حجم الخط يتكيّف حسب عدد الأعمدة
  // القاعدة: عدد الأعمدة الأقل → خط أكبر
  const dynamicFontSize =
    visibleSlots.length <= 6 ? 14 :
    visibleSlots.length <= 8 ? 13 :
    visibleSlots.length <= 10 ? 12 :
    visibleSlots.length <= 14 ? 11 :
    visibleSlots.length <= 18 ? 10 :
    visibleSlots.length <= 24 ? 9 : 8

  // ارتفاع الخلية يتكيّف مع حجم الخط
  const dynamicRowHeight = dynamicFontSize + 18
  const dynamicHeaderHeight = dynamicFontSize + 50

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
                              {visibleSlots.map((slot) => (
                                <th
                  key={slot.index}
                  style={{
                    border: '1px solid #000',
                    background: '#f0f0f0',
                    height: dynamicHeaderHeight,
                    padding: 0,
                    position: 'relative',
                    overflow: 'hidden',
                    fontSize: dynamicFontSize,
                    fontWeight: 'bold',
                    verticalAlign: 'middle',
                    textAlign: 'center',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {useHorizontalTime ? (
                    slot.label
                  ) : (
                    <span style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%) rotate(-90deg)',
                      transformOrigin: 'center',
                      whiteSpace: 'nowrap',
                      fontSize: dynamicFontSize,
                      fontWeight: 'bold',
                      display: 'inline-block'
                    }}>{slot.label}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((dayName, dayIdx) => (
              <tr key={dayIdx}>
                                <td style={{ ...dayCellStyle, fontSize: dynamicFontSize + 1 }}>{dayName}</td>
                {visibleSlots.map((slot) => {
                  if (isCoveredByPrevious(dayIdx, slot.index)) return null
                  const entry = getEntryAt(dayIdx, slot.index)
                  if (entry) {
                    return (
                         <td
                        key={slot.index}
                        colSpan={entry.duration_slots}
                        style={{
                          border: '1px solid #000',
                          padding: '2px 3px',
                          fontSize: dynamicFontSize,
                          textAlign: 'center',
                          background: '#f9f9f9',
                          verticalAlign: 'middle',
                          fontWeight: 'bold',
                          height: dynamicRowHeight
                        }}
                      >
                        {entry.is_break ? 'غداء' : entry.subjects?.name || ''}
                      </td> 
                    )
                  }
                                    return (
                    <td
                      key={slot.index}
                      style={{ border: '1px solid #000', height: dynamicRowHeight }}
                    ></td>
                  )
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

const dayCellStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '2px 4px',
  fontSize: 11,
  fontWeight: 'bold',
  textAlign: 'center',
  background: '#f0f0f0',
  width: 55
}