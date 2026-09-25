import { useState } from 'react'
import './App.css'
import { TimetableView } from './TimetableView'
import { SubjectsManager } from './SubjectsManager'
import { ClassesManager } from './ClassesManager'

type Page = 'timetable' | 'subjects' | 'classes'

function App() {
  const [page, setPage] = useState<Page>('timetable')

  return (
    <div>
      <nav style={navStyle}>
        <div style={{ fontWeight: 'bold', fontSize: 20, marginLeft: 30 }}>
          Mokhref Edu
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setPage('timetable')}
            style={page === 'timetable' ? activeTab : inactiveTab}
          >
            جدول التوقيت
          </button>
          <button
            onClick={() => setPage('subjects')}
            style={page === 'subjects' ? activeTab : inactiveTab}
          >
            إدارة المواد
          </button>
          <button
            onClick={() => setPage('classes')}
            style={page === 'classes' ? activeTab : inactiveTab}
          >
            إدارة الأقسام
          </button>
        </div>
        <div style={{ width: 200 }}></div>
      </nav>

      <div style={{ padding: 20 }}>
        {page === 'timetable' && <TimetableView />}
        {page === 'subjects' && <SubjectsManager />}
        {page === 'classes' && <ClassesManager />}
      </div>
    </div>
  )
}

const navStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: '#1e293b',
  color: 'white',
  padding: '12px 20px',
  direction: 'rtl'
}

const activeTab: React.CSSProperties = {
  background: '#3B82F6',
  color: 'white',
  border: 'none',
  padding: '8px 16px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 'bold'
}

const inactiveTab: React.CSSProperties = {
  background: 'transparent',
  color: 'white',
  border: '1px solid #475569',
  padding: '8px 16px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 14
}

export default App