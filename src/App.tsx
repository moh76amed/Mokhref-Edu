import { useEffect, useState } from 'react'
import './App.css'
import { supabase } from './supabaseClient'
import { LoginPage } from './LoginPage'
import { TimetableView } from './TimetableView'
import { TeacherTimetableView } from './TeacherTimetableView'
import { SubjectsManager } from './SubjectsManager'
import { ClassesManager } from './ClassesManager'
import { LevelsManager } from './LevelsManager'
import { TeachersManager } from './TeachersManager'
import { SettingsPage } from './SettingsPage'

type Page = 'timetable' | 'teacherTimetable' | 'subjects' | 'classes' | 'levels' | 'teachers' | 'settings'

function App() {
  const [page, setPage] = useState<Page>('timetable')
  const [session, setSession] = useState<any>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setChecking(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (checking) {
    return (
      <div style={{ padding: 50, textAlign: 'center', fontFamily: 'Arial', direction: 'rtl' }}>
        جاري التحميل...
      </div>
    )
  }

  if (!session) {
    return <LoginPage />
  }

  return (
    <div>
      <nav style={navStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <div style={{ fontWeight: 'bold', fontSize: 18 }}>
            Mokhref Edu
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
          <button
            onClick={() => setPage('settings')}
            style={page === 'settings' ? activeTab : inactiveTab}
          >
            الإعدادات
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 11, opacity: 0.8 }}>
            {session.user.email}
          </div>
          <button onClick={handleLogout} style={logoutBtn}>
            خروج
          </button>
        </div>
      </nav>

      <div style={{ padding: 20 }}>
        {page === 'timetable' && <TimetableView />}
        {page === 'teacherTimetable' && <TeacherTimetableView />}
        {page === 'subjects' && <SubjectsManager />}
        {page === 'classes' && <ClassesManager />}
        {page === 'levels' && <LevelsManager />}
        {page === 'teachers' && <TeachersManager />}
        {page === 'settings' && <SettingsPage />}
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
  gap: 10,
  flexWrap: 'wrap'
}

const activeTab: React.CSSProperties = {
  background: '#3B82F6',
  color: 'white',
  border: 'none',
  padding: '6px 11px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 'bold'
}

const inactiveTab: React.CSSProperties = {
  background: 'transparent',
  color: 'white',
  border: '1px solid #475569',
  padding: '6px 11px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 12
}

const logoutBtn: React.CSSProperties = {
  background: '#dc3545',
  color: 'white',
  border: 'none',
  padding: '6px 12px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 'bold'
}

export default App