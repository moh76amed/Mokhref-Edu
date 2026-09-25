import { useState } from 'react'
import { supabase } from './supabaseClient'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('يرجى إدخال البريد وكلمة المرور')
      return
    }
    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    })
    setLoading(false)
    if (signInError) {
      setError('بيانات الدخول غير صحيحة، حاول مرة أخرى')
    }
    // عند النجاح، سيتم تحديث حالة المستخدم تلقائيًا في App.tsx
  }

  return (
    <div style={containerStyle}>
      <form onSubmit={handleSubmit} style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏫</div>
          <h1 style={{ margin: 0, fontSize: 24, color: '#1e293b' }}>Mokhref Edu</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            ابتدائية مخرف عمر
          </p>
        </div>

        <label style={labelStyle}>
          البريد الإلكتروني
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            autoFocus
            dir="ltr"
          />
        </label>

        <label style={labelStyle}>
          كلمة المرور
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            dir="ltr"
          />
        </label>

        {error && <div style={errorStyle}>{error}</div>}

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? '...' : 'تسجيل الدخول'}
        </button>
      </form>
    </div>
  )
}

// الأنماط
const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
  padding: 20,
  fontFamily: 'Arial',
  direction: 'rtl'
}

const cardStyle: React.CSSProperties = {
  background: 'white',
  padding: 30,
  borderRadius: 12,
  width: 400,
  maxWidth: '100%',
  boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 14,
  fontWeight: 'bold',
  fontSize: 14,
  color: '#1e293b'
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: 10,
  marginTop: 6,
  fontSize: 15,
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  boxSizing: 'border-box',
  fontFamily: 'inherit'
}

const errorStyle: React.CSSProperties = {
  background: '#fee2e2',
  color: '#991b1b',
  padding: 10,
  borderRadius: 6,
  fontSize: 13,
  marginBottom: 10,
  textAlign: 'center'
}

const buttonStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  background: '#3B82F6',
  color: 'white',
  border: 'none',
  padding: 12,
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 16,
  fontWeight: 'bold',
  marginTop: 8
}