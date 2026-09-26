import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { ConfirmDialog } from './ConfirmDialog'

type Teacher = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  notes: string | null
}

export function TeachersManager() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Teacher | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [error, setError] = useState('')

  // حالة نافذة التأكيد
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTitle, setDialogTitle] = useState('')
  const [dialogMessage, setDialogMessage] = useState<React.ReactNode>('')
  const [dialogVariant, setDialogVariant] = useState<'confirm' | 'info' | 'danger'>('confirm')
  const [dialogOnConfirm, setDialogOnConfirm] = useState<(() => void) | null>(null)

    async function loadTeachers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('is_teacher', true)
      .order('last_name')
    if (error) setError(error.message)
    setTeachers(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadTeachers()
  }, [])

  function openEdit(t: Teacher) {
    setEditing(t)
    setError('')
    setShowForm(true)
  }

  function openGuide() {
    setShowGuide(true)
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

  async function handleDelete(t: Teacher) {
    // فحص هل الأستاذ مرتبط بحصص؟
    const { count, error: checkError } = await supabase
      .from('timetable_entries')
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', t.id)

    if (checkError) {
      showDialog('خطأ في الفحص', checkError.message, 'info')
      return
    }

    if (count && count > 0) {
      showDialog(
        'لا يمكن الحذف',
        `الأستاذ "${t.first_name} ${t.last_name}" مرتبط بـ ${count} حصة.\n\nاحذف الحصص المرتبطة به أولًا.`,
        'info'
      )
      return
    }

    // اطلب تأكيدًا
    showDialog(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف الأستاذ "${t.first_name} ${t.last_name}"؟\n\nملاحظة: هذا يحذفه من قاعدة البيانات فقط، ولا يحذف حساب الدخول.`,
      'danger',
      async () => {
        closeDialog()
        const { error } = await supabase.from('teachers').delete().eq('id', t.id)
        if (error) {
          showDialog('فشل الحذف', error.message, 'info')
          return
        }
        loadTeachers()
      }
    )
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial', direction: 'rtl' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>إدارة الأساتذة ({teachers.length})</h1>
        <button onClick={openGuide} style={primaryBtn}>+ أستاذ جديد</button>
      </div>

      {error && <div style={errorStyle}>{error}</div>}
      {loading && <p>جاري التحميل...</p>}

      <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 20 }}>
        <thead>
          <tr>
            <th style={thStyle}>الاسم واللقب</th>
            <th style={thStyle}>البريد الإلكتروني</th>
            <th style={thStyle}>الهاتف</th>
            <th style={thStyle}>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((t) => (
            <tr key={t.id}>
              <td style={tdStyle}>{t.first_name} {t.last_name}</td>
              <td style={tdStyle}>{t.email || '—'}</td>
              <td style={tdStyle}>{t.phone || '—'}</td>
              <td style={tdStyle}>
                <button onClick={() => openEdit(t)} style={smallBtn}>تعديل</button>
                <button
                  onClick={() => handleDelete(t)}
                  style={{ ...smallBtn, background: '#dc3545', marginRight: 6 }}
                >
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {teachers.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
          لا يوجد أساتذة بعد. اضغط <strong>"+ أستاذ جديد"</strong> لرؤية طريقة الإضافة.
        </div>
      )}

      {showForm && editing && (
        <TeacherForm
          teacher={editing}
          onSaved={() => {
            setShowForm(false)
            loadTeachers()
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {showGuide && (
        <GuideDialog
          onClose={() => setShowGuide(false)}
          onAdded={() => {
            setShowGuide(false)
            loadTeachers()
          }}
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

// نموذج تعديل أستاذ
function TeacherForm({
  teacher,
  onSaved,
  onCancel
}: {
  teacher: Teacher
  onSaved: () => void
  onCancel: () => void
}) {
  const [firstName, setFirstName] = useState(teacher.first_name)
  const [lastName, setLastName] = useState(teacher.last_name)
  const [email, setEmail] = useState(teacher.email || '')
  const [phone, setPhone] = useState(teacher.phone || '')
  const [notes, setNotes] = useState(teacher.notes || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!firstName.trim() || !lastName.trim()) {
      setError('الاسم واللقب مطلوبان')
      return
    }
    setSaving(true)

    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      notes: notes.trim() || null
    }

    const result = await supabase.from('teachers').update(payload).eq('id', teacher.id)

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
        <h2 style={{ marginTop: 0 }}>تعديل بيانات أستاذ</h2>

        <label style={labelStyle}>
          الاسم *
          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} autoFocus />
        </label>

        <label style={labelStyle}>
          اللقب *
          <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} />
        </label>

        <label style={labelStyle}>
          البريد الإلكتروني
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
        </label>

        <label style={labelStyle}>
          الهاتف
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
        </label>

        <label style={labelStyle}>
          ملاحظات
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...inputStyle, height: 60 }} />
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

// نافذة تعليمات إضافة أستاذ جديد
function GuideDialog({
  onClose,
  onAdded
}: {
  onClose: () => void
  onAdded: () => void
}) {
  const [uid, setUid] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!uid.trim() || !firstName.trim() || !lastName.trim()) {
      setError('UID والاسم واللقب مطلوبة')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('teachers').insert({
      id: uid.trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim() || null
    })
    setSaving(false)
    if (error) {
      setError(error.message)
    } else {
      onAdded()
    }
  }

  return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, width: 560 }}>
        <h2 style={{ marginTop: 0 }}>إضافة أستاذ جديد</h2>

        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: 12, borderRadius: 6, marginBottom: 15, fontSize: 14, lineHeight: 1.8 }}>
          <strong>خطوات إضافة أستاذ:</strong>
          <ol style={{ margin: '8px 0 0', paddingRight: 20 }}>
            <li>افتح <strong>Supabase</strong> → <strong>Authentication</strong> → <strong>Users</strong>.</li>
            <li>اضغط <strong>"Add user"</strong> → <strong>"Create new user"</strong>.</li>
            <li>أدخل بريد الأستاذ وكلمة سر مؤقتة، وفعّل <strong>Auto Confirm User</strong>.</li>
            <li>انسخ <strong>UID</strong> الذي يظهر للأستاذ.</li>
            <li>الصقه في الحقل أدناه، واملأ اسمه ولقبه.</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>
            UID (من Supabase) *
            <input type="text" value={uid} onChange={(e) => setUid(e.target.value)} style={inputStyle} placeholder="مثال: 94822738-8cff-49e1-..." />
          </label>

          <label style={labelStyle}>
            الاسم *
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} />
          </label>

          <label style={labelStyle}>
            اللقب *
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} />
          </label>

          <label style={labelStyle}>
            البريد الإلكتروني
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          </label>

          {error && <div style={errorStyle}>{error}</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
            <button type="submit" disabled={saving} style={primaryBtn}>
              {saving ? '...' : 'إضافة الأستاذ'}
            </button>
            <button type="button" onClick={onClose} style={secondaryBtn}>إغلاق</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// الأنماط
const thStyle: React.CSSProperties = {
  border: '1px solid #999', padding: 10, background: '#333',
  color: 'white', textAlign: 'right'
}
const tdStyle: React.CSSProperties = {
  border: '1px solid #ccc', padding: 8, fontSize: 14
}
const primaryBtn: React.CSSProperties = {
  background: '#007bff', color: 'white', border: 'none',
  padding: '10px 18px', borderRadius: 4, cursor: 'pointer',
  fontSize: 15, fontWeight: 'bold'
}
const secondaryBtn: React.CSSProperties = {
  background: '#ddd', color: '#333', border: 'none',
  padding: '10px 18px', borderRadius: 4, cursor: 'pointer', fontSize: 15
}
const smallBtn: React.CSSProperties = {
  background: '#28a745', color: 'white', border: 'none',
  padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 13
}
const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, overflowY: 'auto', padding: 20
}
const modalStyle: React.CSSProperties = {
  background: 'white', padding: 25, borderRadius: 8,
  width: 420, maxWidth: '90%', direction: 'rtl', fontFamily: 'Arial'
}
const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: 12, fontWeight: 'bold', fontSize: 14
}
const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', padding: 8, marginTop: 4,
  fontSize: 15, border: '1px solid #ccc', borderRadius: 4,
  boxSizing: 'border-box', fontFamily: 'inherit'
}
const errorStyle: React.CSSProperties = {
  background: '#ffe0e0', color: '#900', padding: 8,
  borderRadius: 4, fontSize: 13
}