import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { House, ChalkboardTeacher, UsersThree, Wallet, Bell } from '@phosphor-icons/react'
import logo from '@/assets/logo-light.png'
import { Avatar, type PhIcon } from '@/components/ui'
import Home from '@/pages/Home'
import Classes from '@/pages/Classes'
import Students from '@/pages/Students'
import Finance from '@/pages/Finance'
import Notifications from '@/pages/Notifications'
import StudentProfile from '@/pages/StudentProfile'
import ClassDetail from '@/pages/ClassDetail'
import { loadMessages, loadTeacher, type ClassCard } from '@/lib/data'

type Tab = 'home' | 'classes' | 'students' | 'finance'
type Overlay = { type: 'student'; id: string } | { type: 'class'; card: ClassCard } | { type: 'notifications' } | null

const TABS: { key: Tab; label: string; icon: PhIcon }[] = [
  { key: 'home', label: 'الرئيسية', icon: House },
  { key: 'classes', label: 'الحصص', icon: ChalkboardTeacher },
  { key: 'students', label: 'الطلاب', icon: UsersThree },
  { key: 'finance', label: 'المالية', icon: Wallet },
]

export default function AppShell() {
  const [tab, setTab] = useState<Tab>('home')
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [badge, setBadge] = useState(0)
  const [teacher, setTeacher] = useState<{ name: string; photo: string | null }>({ name: '', photo: null })

  useEffect(() => {
    loadTeacher().then(setTeacher).catch(() => {})
    loadMessages().then((m) => setBadge(m.pending + m.failed)).catch(() => {})
  }, [])

  const openStudent = (id: string) => setOverlay({ type: 'student', id })
  const openClass = (card: ClassCard) => setOverlay({ type: 'class', card })
  const back = () => setOverlay(null)

  const screenKey = overlay ? `ov-${overlay.type}-${'id' in overlay ? overlay.id : ''}` : `tab-${tab}`
  const isOverlay = !!overlay

  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col bg-bg shadow-[0_0_80px_-24px_rgba(16,24,40,0.35)]">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-5 py-3">
        <Avatar name={teacher.name || '؟'} photo={teacher.photo} size={40} />
        <img src={logo} alt="درسي" className="h-6 w-auto opacity-90" />
        <button
          onClick={() => setOverlay({ type: 'notifications' })}
          className="relative grid h-10 w-10 place-items-center rounded-full bg-surface text-ink shadow-card active:scale-95"
          aria-label="التنبيهات"
        >
          <Bell size={19} weight="bold" />
          {badge > 0 && (
            <span className="absolute -end-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-bad px-1 text-[10px] font-bold text-white">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-x-hidden px-5 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={screenKey}
            initial={{ opacity: 0, x: isOverlay ? 32 : 0, y: isOverlay ? 0 : 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: isOverlay ? 24 : 0, y: isOverlay ? 0 : -8 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            {overlay?.type === 'student' ? (
              <StudentProfile id={overlay.id} onBack={back} />
            ) : overlay?.type === 'class' ? (
              <ClassDetail card={overlay.card} onBack={back} />
            ) : overlay?.type === 'notifications' ? (
              <Notifications onBack={back} />
            ) : tab === 'home' ? (
              <Home onOpenClass={openClass} />
            ) : tab === 'classes' ? (
              <Classes onOpenClass={openClass} />
            ) : tab === 'students' ? (
              <Students onOpenStudent={openStudent} />
            ) : (
              <Finance />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating pill tab bar */}
      <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[480px] justify-center px-5 pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto flex items-center gap-1 rounded-[26px] border border-line/70 bg-surface/85 p-1.5 shadow-[0_12px_40px_-8px_rgba(16,24,40,0.28)] backdrop-blur-xl">
          {TABS.map((t) => {
            const active = tab === t.key && !overlay
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setOverlay(null) }}
                className="relative flex min-w-[68px] flex-col items-center gap-0.5 rounded-[20px] px-3 py-2"
              >
                {active && (
                  <motion.span
                    layoutId="navpill"
                    className="absolute inset-0 rounded-[20px] bg-brand/10"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <span className={`relative z-10 transition-colors ${active ? 'text-brand' : 'text-muted'}`}>
                  <Icon size={22} weight={active ? 'fill' : 'regular'} />
                </span>
                <span className={`relative z-10 text-[11px] font-bold transition-colors ${active ? 'text-brand' : 'text-muted'}`}>
                  {t.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
