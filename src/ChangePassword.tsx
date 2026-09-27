import { useState } from 'react'
import { supabase } from './supabaseClient'

type Props = {
  onClose: () => void
}

export function ChangePassword({ onClose }: Props) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // التحقق من الحقول
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('جميع الحقول مطلوبة')
      return
    }

    if (newPassword.length < 8) {
      setError('كلمة السر الجديدة يجب أن تكون 8 أحرف على الأقل')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('كلمة السر الجديدة وتأكيدها غير متطابقين')
      return
    }

    if (newPassword === currentPassword) {
      setError('كلمة السر الجديدة يجب أن تختلف عن الحالية')
      return
    }

    setSaving(true)

    // 1) التحقق من كلمة السر الحالية
    const { data: userData } = await supabase.auth.getUser()
    const userEmail = userData?.user?.email

    if (!userEmail) {
      setSaving(false)
      setError('لم يتم العثور على المستخدم الحالي')
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword
    })

    if (signInError) {
      setSaving(false)
      setError('كلمة السر الحالية غير صحيحة')
      return
    }

    // 2) تغيير كلمة السر
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    setSaving(false)

    if (updateError) {
      setError('فشل تغيير كلمة السر: ' + updateError.message)
      return
    }

    setSuccess(true)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')

    // إغلاق تلقائي بعد 3 ثوان
    setTimeout(() => {
      onClose()
    }, 3000)
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <h2 style={{ margin: 0 }}>🔑 تغيير كلمة السر</h2>
          <button onClick={onClose} style={closeBtn}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>
            كلمة السر الحالية *
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={inputStyle}
              dir="ltr"
              autoFocus
            />
          </label>

          <label style={labelStyle}>
            كلمة السر الجديدة * (8 أحرف على الأقل)
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={inputStyle}
              dir="ltr"
            />
          </label>

          <label style={labelStyle}>
            تأكيد كلمة السر الجديدة *
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
              dir="ltr"
            />
          </label>

          {error && <div style={errorStyle}>{error}</div>}
          {success && (
            <div style={successStyle}>
              ✅ تم تغيير كلمة السر بنجاح. سيتم إغلاق النافذة...
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
            <button type="submit" disabled={saving} style={primaryBtn}>
              {saving ? '...' : 'تغيير كلمة السر'}
            </button>
            <button type="button" onClick={onClose} style={secondaryBtn}>
              إلغاء
            </button>
          </div>
        </form>

        <div style={{ marginTop: 15, fontSize: 12, color: '#666', borderTop: '1px solid #eee', paddingTop: 10 }}>
          <strong>ملاحظة:</strong> بعد تغيير كلمة السر، ستحتاج إلى استعمالها في تسجيل الدخول القادم.
        </div>
      </div>
    </div>
  )
}

// الأنماط
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 20
}
const modalStyle: React.CSSProperties = {
  background: 'white',
  padding: 25,
  borderRadius: 8,
  width: 460,
  maxWidth: '90%',
  direction: 'rtl',
  fontFamily: 'Arial',
  boxShadow: '0 20px 50px rgba(0,0,0,0.4)'
}
const closeBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  fontSize: 24,
  cursor: 'pointer',
  color: '#666',
  lineHeight: 1,
  padding: 0,
  width: 30,
  height: 30
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
  padding: 10,
  borderRadius: 4,
  fontSize: 13,
  marginTop: 8
}
const successStyle: React.CSSProperties = {
  background: '#dcfce7',
  color: '#166534',
  padding: 10,
  borderRadius: 4,
  fontSize: 13,
  marginTop: 8
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