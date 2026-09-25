import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { ConfirmDialog } from './ConfirmDialog'

type Subject = {
  id: number
  name: string
  code: string | null
  color: string
}

export function SubjectsManager() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Subject | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  // حالة نافذة التأكيد
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTitle, setDialogTitle] = useState('')
  const [dialogMessage, setDialogMessage] = useState<React.ReactNode>('')
  const [dialogVariant, setDialogVariant] = useState<'confirm' | 'info' | 'danger'>('confirm')
  const [dialogOnConfirm, setDialogOnConfirm] = useState<(() => void) | null>(null)

  async function loadSubjects() {
    setLoading(true)
    const { data, error } = await supabase.from('subjects').select('*').order('id')
    if (error) setError(error.message)
    setSubjects(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadSubjects()
  }, [])

  function openAdd() {
    setEditing(null)
    setError('')
    setShowForm(true)
  }

  function openEdit(s: Subject) {
    setEditing(s)
    setError('')
    setShowForm(true)
  }

  function showDialog(
    title: string,
    message: React.ReactNode,
    variant: 'confirm' | 'info' | 'danger',
    onConfirm: (() => void) | null = null
  ) {
    setDialogTitle(title)
    setDialogMessage(message)
    setDialogVariant(variant)
    setDialogOnConfirm(() => onConfirm)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setDialogOnConfirm(null)
  }

  async function handleDelete(s: Subject) {
    // فحص هل المادة مرتبطة بحصص؟
    const { count, error: checkError } = await supabase
      .from('timetable_entries')
      .select('*', { count: 'exact', head: true })
      .eq('subject_id', s.id)

    if (checkError) {
      showDialog('خطأ في الفحص', checkError.message, 'info')
      return
    }

    if (count && count > 0) {
      showDialog(
        'لا يمكن الحذف',
        `المادة "${s.name}" مرتبطة بـ ${count} حصة في جدول التوقيت.\n\nاحذف الحصص المرتبطة بها أولًا.`,
        'info'
      )
      return
    }

    // اطلب تأكيدًا
    showDialog(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف المادة "${s.name}"؟\n\nلا يمكن التراجع عن هذه العملية.`,
      'danger',
      async () => {
        closeDialog()
        const { error } = await supabase.from('subjects').delete().eq('id', s.id)
        if (error) {
          showDialog('فشل الحذف', error.message, 'info')
          return
        }
        loadSubjects()
      }
    )
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial', direction: 'rtl' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>إدارة المواد ({subjects.length})</h1>
        <button onClick={openAdd} style={primaryBtn}>+ مادة جديدة</button>
      </div>

      {error && <div style={errorStyle}>{error}</div>}
      {loading && <p>جاري التحميل...</p>}

      <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 20 }}>
        <thead>
          <tr>
            <th style={thStyle}>اللون</th>
            <th style={thStyle}>اسم المادة</th>
            <th style={thStyle}>الرمز</th>
            <th style={thStyle}>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((s) => (
            <tr key={s.id}>
              <td style={tdStyle}>
                <div style={{
                  width: 30, height: 30,
                  background: s.color,
                  borderRadius: 4,
                  border: '1px solid #999'
                }} />
              </td>
              <td style={tdStyle}>{s.name}</td>
              <td style={tdStyle}>{s.code || '—'}</td>
              <td style={tdStyle}>
                <button onClick={() => openEdit(s)} style={smallBtn}>تعديل</button>
                <button
                  onClick={() => handleDelete(s)}
                  style={{ ...smallBtn, background: '#dc3545', marginRight: 6 }}
                >
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <SubjectForm
          subject={editing}
          onSaved={() => {
            setShowForm(false)
            loadSubjects()
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <ConfirmDialog
        open={dialogOpen}
        title={dialogTitle}
        message={dialogMessage}
        variant={dialogVariant}
        onConfirm={dialogOnConfirm || closeDialog}
        onCancel={closeDialog}
      />
    </div>
  )
}

function SubjectForm({
  subject,
  onSaved,
  onCancel
}: {
  subject: Subject | null
  onSaved: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState(subject?.name || '')
  const [code, setCode] = useState(subject?.code || '')
  const [color, setColor] = useState(subject?.color || '#3B82F6')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('اسم المادة مطلوب')
      return
    }
    setSaving(true)

    const payload = { name: name.trim(), code: code.trim() || null, color }

    let result
    if (subject) {
      result = await supabase.from('subjects').update(payload).eq('id', subject.id)
    } else {
      result = await supabase.from('subjects').insert(payload)
    }

    setSaving(false)
    if (result.error) {
      setError(result.error.message)
    } else {
      onSaved()
    }
  }

  return (
    <div style={overlayStyle}>
      <form onSubmit={handleSubmit} style={modalStyle}>
        <h2 style={{ marginTop: 0 }}>
          {subject ? 'تعديل مادة' : 'مادة جديدة'}
        </h2>

        <label style={labelStyle}>
          اسم المادة *
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
            autoFocus
          />
        </label>

        <label style={labelStyle}>
          الرمز (اختياري)
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          اللون
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ width: 60, height: 40, cursor: 'pointer', border: '1px solid #ccc' }}
            />
            <span style={{ fontFamily: 'monospace' }}>{color}</span>
          </div>
        </label>

        {error && <div style={errorStyle}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
          <button type="submit" disabled={saving} style={primaryBtn}>
            {saving ? '...' : 'حفظ'}
          </button>
          <button type="button" onClick={onCancel} style={secondaryBtn}>إلغاء</button>
        </div>
      </form>
    </div>
  )
}

// الأنماط
const thStyle: React.CSSProperties = {
  border: '1px solid #999',
  padding: 10,
  background: '#333',
  color: 'white',
  textAlign: 'right'
}
const tdStyle: React.CSSProperties = {
  border: '1px solid #ccc',
  padding: 8,
  fontSize: 14
}
const primaryBtn: React.CSSProperties = {
  background: '#007bff',
  color: 'white',
  border: 'none',
  padding: '10px 18px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 15,
  fontWeight: 'bold'
}
const secondaryBtn: React.CSSProperties = {
  background: '#ddd',
  color: '#333',
  border: 'none',
  padding: '10px 18px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 15
}
const smallBtn: React.CSSProperties = {
  background: '#28a745',
  color: 'white',
  border: 'none',
  padding: '6px 12px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13
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
  borderRadius: 4,
  boxSizing: 'border-box'
}
const errorStyle: React.CSSProperties = {
  background: '#ffe0e0',
  color: '#900',
  padding: 8,
  borderRadius: 4,
  fontSize: 13
}