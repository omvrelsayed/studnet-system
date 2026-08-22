import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Receipt, TrendUp, TrendDown, ChartLineUp, Wallet, UsersThree, SealCheck, UserMinus } from '@phosphor-icons/react'
import { loadHome, money, greeting, firstName, todayLabel, type Home as HomeData, type ClassCard } from '@/lib/data'
import { IconTile, Sparkline, Bar, Spinner, Section } from '@/components/ui'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
}
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

export default function Home(_: { onOpenClass: (c: ClassCard) => void }) {
  const [d, setD] = useState<HomeData | null>(null)
  useEffect(() => {
    loadHome().then(setD)
  }, [])

  return (
    <div>
      <div className="flex items-baseline justify-between pt-1">
        <h1 className="text-2xl font-extrabold leading-tight">
          {greeting()}
          {d ? <span className="text-brand">، {firstName(d.teacherName)}</span> : ''}
        </h1>
        <span className="text-xs text-muted">{todayLabel()}</span>
      </div>
      <p className="mt-1 text-sm text-muted">نظرة على فصلك وأداءك المالي</p>

      {!d ? (
        <Spinner />
      ) : (
        <motion.div variants={container} initial="hidden" animate="show">
          {/* Total revenue hero */}
          <motion.div
            variants={item}
            className="relative mt-5 overflow-hidden rounded-[26px] bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] p-6 text-white shadow-[0_20px_40px_-16px_rgba(79,70,229,0.6)]"
          >
            <div className="pointer-events-none absolute -end-14 -top-16 h-52 w-52 rounded-full bg-white/15 blur-2xl" />
            <div className="flex items-center gap-2 text-sm font-bold text-white/90">
              <Receipt size={18} weight="bold" /> إجمالي إيرادات الشهر
            </div>
            <div className="mt-2 text-4xl font-black tracking-tight">{money(d.revenue)}</div>
            {d.revenuePrevPct != null && (
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                {d.revenuePrevPct >= 0 ? <TrendUp size={14} weight="bold" className="text-emerald-300" /> : <TrendDown size={14} weight="bold" className="text-rose-300" />}
                <span className={d.revenuePrevPct >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                  {`${d.revenuePrevPct >= 0 ? '+' : ''}${d.revenuePrevPct.toFixed(1)}%`}
                </span>
                <span className="text-white/70">عن الشهر الماضي</span>
              </div>
            )}
          </motion.div>

          {/* Net profit / operating costs */}
          <div className="mt-3 grid grid-cols-1 gap-3">
            <motion.div variants={item} className="card flex items-center justify-between p-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-muted">صافي الربح</div>
                <div className="mt-1 text-2xl font-extrabold">{money(d.netProfit)}</div>
              </div>
              <IconTile icon={ChartLineUp} tone="good" size={44} />
            </motion.div>
            <motion.div variants={item} className="card flex items-center justify-between p-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-muted">المصروفات</div>
                <div className="mt-1 text-2xl font-extrabold">{money(d.costs)}</div>
              </div>
              <IconTile icon={Wallet} tone="bad" size={44} />
            </motion.div>
          </div>

          <Section title="رؤى الفصل">
            <div className="flex flex-col gap-3">
              {/* Active students */}
              <motion.div variants={item} className="card p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-muted">الطلاب النشطون</div>
                  <IconTile icon={UsersThree} tone="brand" size={38} />
                </div>
                <div className="mt-2 flex items-end gap-2">
                  <div className="text-3xl font-black">{d.activeStudents}</div>
                  {d.newThisMonth > 0 && (
                    <div className="mb-1 flex items-center gap-0.5 text-xs font-bold text-good">
                      <TrendUp size={13} weight="bold" /> {d.newThisMonth} جديد
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <Sparkline data={d.attendanceSeries} color="#4F46E5" />
                </div>
              </motion.div>

              {/* Attendance rate */}
              <motion.div variants={item} className="card p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-muted">نسبة الحضور</div>
                  <IconTile icon={SealCheck} tone="brand" size={38} />
                </div>
                <div className="mt-2 flex items-end gap-2">
                  <div className="text-3xl font-black">{d.attendanceRate == null ? '—' : `${Math.round(d.attendanceRate)}%`}</div>
                  <div className="mb-1 text-xs font-bold text-muted">هذا الأسبوع</div>
                </div>
                <div className="mt-4">
                  <Bar pct={d.attendanceRate ?? 0} />
                </div>
              </motion.div>

              {/* Absences today */}
              <motion.div variants={item} className="card p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-muted">غياب اليوم</div>
                  <IconTile icon={UserMinus} tone="bad" size={38} />
                </div>
                <div className="mt-2 flex items-end gap-2">
                  <div className="text-3xl font-black">{d.absentToday}</div>
                  <div className={`mb-1 text-xs font-bold ${d.absentToday > 0 ? 'text-bad' : 'text-good'}`}>
                    {d.absentToday > 0 ? 'يتطلب المتابعة' : 'ممتاز'}
                  </div>
                </div>
                <div className="mt-3">
                  <Sparkline data={d.absenceSeries} color="#DC2626" fill="#FEE2E2" />
                </div>
              </motion.div>
            </div>
          </Section>
        </motion.div>
      )}
    </div>
  )
}
