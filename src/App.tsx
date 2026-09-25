import { useState } from 'react'
import './App.css'
import { TimetableView } from './TimetableView'
import { TeacherTimetableView } from './TeacherTimetableView'
import { SubjectsManager } from './SubjectsManager'
import { ClassesManager } from './ClassesManager'
import { LevelsManager } from './LevelsManager'
import { TeachersManager } from './TeachersManager'

type Page = 'timetable' | 'teacherTimetable' | 'subjects' | 'classes' | 'levels' | 'teachers'

function App() {
  const [page, setPage] = useState<Page>('timetable')

  return (
    <div>
      <nav style={navStyle}>
        <div style={{ fontWeight: 'bold', fontSize: 20, marginLeft: 20 }}>
          Mokhref Edu
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setPage('timetable')}
            style={page === 'timetable' ? activeTab : inactiveTab}
          >
            توقيت القسم
          </button>
          <button
            onClick={() => setPage('teacherTimetable')}
            style={page === 'teacherTimetable' ? activeTab : inactiveTab}
          >
            توقيت الأستاذ
          </button>
          <button
            onClick={() => setPage('subjects')}
            style={page === 'subjects' ? activeTab : inactiveTab}
          >
            المواد
          </button>
          <button
            onClick={() => setPage('classes')}
            style={page === 'classes' ? activeTab : inactiveTab}
          >
            الأقسام
          </button>
          <button
            onClick={() => setPage('levels')}
            style={page === 'levels' ? activeTab : inactiveTab}
          >
            السنوات
          </button>
          <button
            onClick={() => setPage('teachers')}
            style={page === 'teachers' ? activeTab : inactiveTab}
          >
            الأساتذة
          </button>
        </div>
        <div style={{ width: 120 }}></div>
      </nav>

      <div style={{ padding: 20 }}>
        {page === 'timetable' && <TimetableView />}
        {page === 'teacherTimetable' && <TeacherTimetableView />}
        {page === 'subjects' && <SubjectsManager />}
        {page === 'classes' && <ClassesManager />}
        {page === 'levels' && <LevelsManager />}
        {page === 'teachers' && <TeachersManager />}
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
  padding: '10px 16px',
  direction: 'rtl',
  gap: 10
}

const activeTab: React.CSSProperties = {
  background: '#3B82F6',
  color: 'white',
  border: 'none',
  padding: '7px 13px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 'bold'
}

const inactiveTab: React.CSSProperties = {
  background: 'transparent',
  color: 'white',
  border: '1px solid #475569',
  padding: '7px 13px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13
}

export default App