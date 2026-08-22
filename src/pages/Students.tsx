import { useEffect, useMemo, useState } from 'react'
import { MagnifyingGlass, CaretLeft } from '@phosphor-icons/react'
import { loadStudents, type StudentListItem } from '@/lib/data'
import { Avatar, Spinner, Empty } from '@/components/ui'

export default function Students({ onOpenStudent }: { onOpenStudent: (id: string) => void }) {
  const [q, setQ] = useState('')
  const [all, setAll] = useState<StudentListItem[] | null>(null)

  useEffect(() => {
    loadStudents('').then(setAll)
  }, [])

  const list = useMemo(() => {
    if (!all) return null
    const s = q.trim()
    return s ? all.filter((x) => x.name.includes(s)) : all
  }, [all, q])

  return (
    <div>
      <h1 className="pt-1 text-2xl font-extrabold">الطلاب</h1>

      <div className="relative mt-4">
        <span className="pointer-events-none absolute inset-y-0 end-3.5 grid place-items-center text-muted">
          <MagnifyingGlass size={18} weight="bold" />
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث باسم الطالب…"
          className="w-full rounded-xl2 border border-line bg-surface py-3 pe-11 ps-4 text-start outline-none focus:border-brand"
        />
      </div>

      <div className="mt-4">
        {!list ? (
          <Spinner />
        ) : list.length === 0 ? (
          <Empty text="لا يوجد طلاب مطابقون" />
        ) : (
          <>
            <div className="mb-2 text-xs text-muted">{list.length} طالب</div>
            <div className="flex flex-col gap-2">
              {list.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onOpenStudent(s.id)}
                  className="card flex items-center gap-3 p-2.5 text-start active:scale-[0.99]"
                >
                  <Avatar name={s.name} photo={s.photo} size={42} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{s.name}</div>
                    <div className="text-xs text-muted">{s.group}</div>
                  </div>
                  <CaretLeft size={16} weight="bold" className="text-line" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
