import { useEffect, useState } from 'react'
import { loadClassDetail, time12, type ClassCard, type Person } from '@/lib/data'
import { Avatar, Spinner, Empty } from '@/components/ui'
import BackBar from '@/components/BackBar'

export default function ClassDetail({ card, onBack }: { card: ClassCard; onBack: () => void }) {
  const [data, setData] = useState<{ present: Person[]; absent: Person[] } | null>(null)
  const [tab, setTab] = useState<'present' | 'absent'>('present')

  useEffect(() => {
    if (card.sessionId) loadClassDetail(card.sessionId).then(setData)
    else setData({ present: [], absent: [] })
  }, [card.sessionId])

  return (
    <div>
      <BackBar title={card.group} subtitle={card.grade} onBack={onBack} />

      <div className="card p-4">
        <div className="text-sm text-muted">
          {time12(card.start)}
          {card.end ? ` — ${time12(card.end)}` : ''}
        </div>
        <div className="mt-2 flex items-center gap-4">
          <Stat n={card.total} label="طالب" tone="ink" />
          <Stat n={card.present} label="حضر" tone="good" />
          <Stat n={card.absent} label="غياب" tone="bad" />
        </div>
        {!card.started && <div className="mt-2 text-xs font-semibold text-warn">لم تبدأ هذه الحصة بعد</div>}
      </div>

      {card.started && (
        <>
          <div className="mt-4 flex gap-1.5 rounded-full bg-surface p-1 shadow-card">
            <TabBtn active={tab === 'present'} onClick={() => setTab('present')} label={`الحاضرون (${card.present})`} />
            <TabBtn active={tab === 'absent'} onClick={() => setTab('absent')} label={`الغائبون (${card.absent})`} />
          </div>

          <div className="mt-3">
            {!data ? (
              <Spinner />
            ) : (
              <PersonList people={tab === 'present' ? data.present : data.absent} empty={tab === 'present' ? 'لا يوجد حاضرون' : 'لا يوجد غائبون'} />
            )}
          </div>
        </>
      )}
    </div>
  )
}

function Stat({ n, label, tone }: { n: number; label: string; tone: 'ink' | 'good' | 'bad' }) {
  const c = tone === 'good' ? 'text-good' : tone === 'bad' ? 'text-bad' : 'text-ink'
  return (
    <div className="text-center">
      <div className={`text-2xl font-black ${c}`}>{n}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  )
}
function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-full py-1.5 text-sm font-bold transition ${active ? 'bg-brand text-white' : 'text-muted'}`}
    >
      {label}
    </button>
  )
}
function PersonList({ people, empty }: { people: Person[]; empty: string }) {
  if (people.length === 0) return <Empty text={empty} />
  return (
    <div className="flex flex-col gap-2">
      {people.map((p) => (
        <div key={p.id} className="card flex items-center gap-3 p-2.5">
          <Avatar name={p.name} photo={p.photo} size={38} />
          <span className="font-bold">{p.name}</span>
          {p.makeup && <span className="chip bg-brand/10 text-brand">تعويض</span>}
        </div>
      ))}
    </div>
  )
}
