import { useEffect, useState } from 'react'
import { Clock, CaretLeft } from '@phosphor-icons/react'
import { loadClasses, time12, todayLabel, type ClassCard } from '@/lib/data'
import { Spinner, Empty } from '@/components/ui'

export default function Classes({ onOpenClass }: { onOpenClass: (c: ClassCard) => void }) {
  const [list, setList] = useState<ClassCard[] | null>(null)
  useEffect(() => {
    loadClasses().then(setList)
  }, [])

  return (
    <div>
      <div className="flex items-baseline justify-between pt-1">
        <h1 className="text-2xl font-extrabold">الحصص</h1>
        <span className="text-xs text-muted">{todayLabel()}</span>
      </div>

      {!list ? (
        <Spinner />
      ) : list.length === 0 ? (
        <div className="mt-5">
          <Empty text="لا توجد حصص مجدولة اليوم" />
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          {list.map((c) => (
            <ClassRow key={c.key} c={c} onClick={() => onOpenClass(c)} />
          ))}
        </div>
      )}
    </div>
  )
}

export function ClassRow({ c, onClick }: { c: ClassCard; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card flex items-center gap-3 p-4 text-start transition active:scale-[0.99]">
      <div className="min-w-0 flex-1">
        <div className="font-extrabold">
          {c.group}
          {c.grade ? <span className="text-xs font-semibold text-muted"> · {c.grade}</span> : null}
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted">
          <Clock size={13} weight="bold" />
          {time12(c.start)}
          {c.end ? ` — ${time12(c.end)}` : ''}
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm font-bold">
          {c.started ? (
            <>
              <span className="text-good">{c.present} حاضر</span>
              <span className="text-line">·</span>
              <span className="text-bad">{c.absent} غائب</span>
              <span className="text-line">·</span>
              <span className="text-muted">{c.total} طالب</span>
            </>
          ) : (
            <>
              <span className="chip bg-bg text-muted">لم تبدأ</span>
              <span className="text-muted">{c.total} طالب</span>
            </>
          )}
        </div>
      </div>
      <CaretLeft size={18} weight="bold" className="text-line" />
    </button>
  )
}
