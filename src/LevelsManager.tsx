import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { ConfirmDialog } from './ConfirmDialog'

type Level = {
  id: number
  name: string
  code: string | null
  stage: string | null
  order_index: number
}

export function LevelsManager() {
  const [levels, setLevels] = useState<Level[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Level | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  // حالة نافذة التأكيد
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTitle, setDialogTitle] = useState('')
  const [dialogMessage, setDialogMessage] = useState<React.ReactNode>('')
  const [dialogVariant, setDialogVariant] = useState<'confirm' | 'info' | 'danger'>('confirm')
  const [dialogOnConfirm, setDialogOnConfirm] = useState<(() => void) | null>(null)

  async function loadLevels() {
    setLoading(true)
    const { data, error } = await supabase
      .from('levels')
      .select('*')
      .order('order_index')
    if (error) setError(error.message)
    setLevels(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadLevels()
  }, [])

  function openAdd() {
    setEditing(null)
    setError('')
    setShowForm(true)
  }

  function openEdit(l: Level) {
    setEditing(l)
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

  async function handleDelete(l: Level) {
    // فحص هل السنة مرتبطة بأقسام؟
    const { count, error: checkError } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('level_id', l.id)

    if (checkError) {
      showDialog('خطأ في الفحص', checkError.message, 'info')
      return
    }

    if (count && count > 0) {
      showDialog(
        'لا يمكن الحذف',
        `السنة "${l.name}" مرتبطة بـ ${count} قسم.\n\nاحذف الأقسام المرتبطة بها أولًا.`,
        'info'
      )
      return
    }

    // اطلب تأكيدًا
    showDialog(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف السنة "${l.name}"؟\n\nلا يمكن التراجع عن هذه العملية.`,
      'danger',
      async () => {
        closeDialog()
        const { error } = await supabase.from('levels').delete().eq('id', l.id)
        if (error) {
          showDialog('فشل الحذف', error.message, 'info')
          return
        }
        loadLevels()
      }
    )
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial', direction: 'rtl' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>إدارة السنوات الدراسية ({levels.length})</h1>
        <button onClick={openAdd} style={primaryBtn}>+ سنة جديدة</button>
      </div>

      {error && <div style={errorStyle}>{error}</div>}
      {loading && <p>جاري التحميل...</p>}

      <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 20 }}>
        <thead>
          <tr>
            <th style={thStyle}>الترتيب</th>
            <th style={thStyle}>اسم السنة</th>
            <th style={thStyle}>الرمز</th>
            <th style={thStyle}>المرحلة</th>
            <th style={thStyle}>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {levels.map((l) => (
            <tr key={l.id}>
              <td style={tdStyle}>{l.order_index}</td>
              <td style={tdStyle}>{l.name}</td>
              <td style={tdStyle}>{l.code || '—'}</td>
              <td style={tdStyle}>{l.stage || '—'}</td>
              <td style={tdStyle}>
                <button onClick={() => openEdit(l)} style={smallBtn}>تعديل</button>
                <button
                  onClick={() => handleDelete(l)}
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
        <LevelForm
          level={editing}
          onSaved={() => {
            setShowForm(false)
            loadLevels()
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

function LevelForm({
  level,
  onSaved,
  onCancel
}: {
  level: Level | null
  onSaved: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState(level?.name || '')
  const [code, setCode] = useState(level?.code || '')
  const [stage, setStage] = useState(level?.stage || 'ابتدائي')
  const [orderIndex, setOrderIndex] = useState<number>(level?.order_index || 0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('اسم السنة مطلوب')
      return
    }
    setSaving(true)

    const payload = {
      name: name.trim(),
      code: code.trim() || null,
      stage: stage.trim() || null,
      order_index: orderIndex
    }

    let result
    if (level) {
      result = await supabase.from('levels').update(payload).eq('id', level.id)
    } else {
      result = await supabase.from('levels').insert(payload)
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
          {level ? 'تعديل سنة' : 'سنة جديدة'}
        </h2>

        <label style={labelStyle}>
          اسم السنة *
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
          المرحلة
          <input
            type="text"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            style={inputStyle}
            placeholder="ابتدائي / متوسط / ثانوي"
          />
        </label>

        <label style={labelStyle}>
          الترتيب (0، 1، 2...)
          <input
            type="number"
            value={orderIndex}
            onChange={(e) => setOrderIndex(Number(e.target.value))}
            style={inputStyle}
            min={0}
          />
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