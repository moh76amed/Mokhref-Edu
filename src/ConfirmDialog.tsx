import type { ReactNode } from 'react'

type DialogVariant = 'confirm' | 'info' | 'danger'

type Props = {
  open: boolean
  title: string
  message: ReactNode
  variant?: DialogVariant
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  variant = 'confirm',
  confirmText,
  cancelText = 'إلغاء',
  onConfirm,
  onCancel
}: Props) {
  if (!open) return null

  // لون زر التأكيد حسب النوع
  const confirmBtnColor =
    variant === 'danger' ? '#dc3545' :
    variant === 'info'   ? '#0ea5e9' :
                           '#007bff'

  const icon =
    variant === 'danger' ? '⚠️' :
    variant === 'info'   ? 'ℹ️' :
                           '❓'

  const defaultConfirm = variant === 'info' ? 'حسنًا' : 'تأكيد'

  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 10 }}>
          {icon}
        </div>

        <h2 style={titleStyle}>{title}</h2>

        <div style={messageStyle}>{message}</div>

        <div style={buttonsRowStyle}>
          <button
            onClick={onConfirm || onCancel}
            style={{ ...btnStyle, background: confirmBtnColor, color: 'white' }}
            autoFocus
          >
            {confirmText || defaultConfirm}
          </button>

          {variant !== 'info' && (
            <button
              onClick={onCancel}
              style={{ ...btnStyle, background: '#e5e7eb', color: '#333' }}
            >
              {cancelText}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// === الأنماط ===
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
  backdropFilter: 'blur(2px)'
}

const modalStyle: React.CSSProperties = {
  background: 'white',
  padding: '30px 25px 20px',
  borderRadius: 12,
  width: 420,
  maxWidth: '90%',
  direction: 'rtl',
  fontFamily: 'Arial, sans-serif',
  boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
  animation: 'fadeIn 0.15s ease-out'
}

const titleStyle: React.CSSProperties = {
  margin: '0 0 12px',
  textAlign: 'center',
  fontSize: 22,
  color: '#1e293b'
}

const messageStyle: React.CSSProperties = {
  textAlign: 'center',
  fontSize: 15,
  color: '#475569',
  lineHeight: 1.7,
  marginBottom: 22,
  whiteSpace: 'pre-line'
}

const buttonsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  justifyContent: 'center'
}

const btnStyle: React.CSSProperties = {
  border: 'none',
  padding: '10px 24px',
  borderRadius: 6,
  fontSize: 15,
  fontWeight: 'bold',
  cursor: 'pointer',
  minWidth: 100
}