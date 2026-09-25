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

type Page = 'timetable' | 'teacherTimetable' | 'subjects' | 'classes' | 'levels' | 'teachers'

function App() {
  const [page, setPage] = useState<Page>('timetable')
  const [session, setSession] = useState<any>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // فحص الجلسة الحالية
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setChecking(false)
    })

    // الاستماع لتغيّرات حالة الدخول
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

  // أثناء فحص الجلسة
  if (checking) {
    return (
      <div style={{ padding: 50, textAlign: 'center', fontFamily: 'Arial', direction: 'rtl' }}>
        جاري التحميل...
      </div>
    )
  }

  // إذا لم يكن مسجّلًا، اعرض صفحة الدخول
  if (!session) {
    return <LoginPage />
  }

  // مسجّل → اعرض النظام
  return (
    <div>
      <nav style={navStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <div style={{ fontWeight: 'bold', fontSize: 18 }}>
            Mokhref Edu
          </div>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
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

const logoutBtn: React.CSSProperties = {
  background: '#dc3545',
  color: 'white',
  border: 'none',
  padding: '6px 12px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 'bold'
}

export default App