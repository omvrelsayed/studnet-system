import { useEffect, useState } from 'react'
import { loadStudentProfile, money, shortDate, type StudentProfile as Profile } from '@/lib/data'
import { Avatar, Spinner, Empty } from '@/components/ui'
import BackBar from '@/components/BackBar'

const PAY_TONE: Record<Profile['paymentStatus'], string> = {
  مدفوع: 'bg-goodbg text-good',
  جزئي: 'bg-amber-100 text-warn',
  متأخر: 'bg-badbg text-bad',
}

export default function StudentProfile({ id, onBack }: { id: string; onBack: () => void }) {
  const [p, setP] = useState<Profile | null>(null)
  useEffect(() => {
    loadStudentProfile(id).then(setP)
  }, [id])

  return (
    <div>
      <BackBar title="ملف الطالب" onBack={onBack} />
      {!p ? (
        <Spinner />
      ) : (
        <>
          {/* identity */}
          <div className="card flex items-center gap-3 p-4">
            <Avatar name={p.name} photo={p.photo} size={60} />
            <div>
              <div className="text-lg font-extrabold">{p.name}</div>
              <div className="text-sm text-muted">
                {p.group}
                {p.grade ? ` · ${p.grade}` : ''}
              </div>
            </div>
          </div>

          {/* quick summary */}
          <div className="mt-3 grid grid-cols-3 gap-3">
            <Mini value={String(p.presentCount)} label="حضور" tone="good" />
            <Mini value={String(p.absentCount)} label="غياب" tone="bad" />
            <div className="card flex flex-col items-center justify-center gap-1 p-3.5 text-center">
              <span className={`chip ${PAY_TONE[p.paymentStatus]}`}>{p.paymentStatus}</span>
              <span className="text-[11px] text-muted">الدفع</span>
            </div>
          </div>

          {/* payment */}
          <div className="card mt-3 p-4">
            <div className="mb-2 text-sm font-extrabold">الدفع</div>
            <Line k="اشتراك الشهر" v={money(p.fee)} />
            <Line k="مدفوع هذا الشهر" v={money(p.monthPaid)} />
            <Line
              k="آخر دفعة"
              v={p.lastPayment ? `${money(p.lastPayment.amount)} · ${shortDate(p.lastPayment.date)}` : 'لا يوجد'}
            />
          </div>

          {/* last sessions */}
          <div className="card mt-3 p-4">
            <div className="mb-2 text-sm font-extrabold">آخر الحصص</div>
            {p.lastSessions.length === 0 ? (
              <Empty text="لا يوجد سجل حضور" />
            ) : (
              <div className="flex flex-col gap-1.5">
                {p.lastSessions.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-muted">{shortDate(s.date)}</span>
                    <span className="flex items-center gap-1.5 font-bold">
                      {s.makeup && <span className="chip bg-brand/10 text-brand">تعويض</span>}
                      <span className={s.present ? 'text-good' : 'text-bad'}>{s.present ? 'حضر' : 'غاب'}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function Mini({ value, label, tone }: { value: string; label: string; tone: 'good' | 'bad' }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-0.5 p-3.5 text-center">
      <div className={`text-2xl font-black ${tone === 'good' ? 'text-good' : 'text-bad'}`}>{value}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  )
}
function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2 text-sm last:border-0">
      <span className="text-muted">{k}</span>
      <span className="font-bold">{v}</span>
    </div>
  )
}
