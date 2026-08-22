import type { ReactNode } from 'react'
import { CircleNotch, type Icon } from '@phosphor-icons/react'

export type PhIcon = Icon

export function Avatar({ name, photo, size = 44 }: { name: string; photo?: string | null; size?: number }) {
  return (
    <div
      className="grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand/10 font-black text-brand ring-1 ring-line"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : (name.trim()[0] ?? '؟')}
    </div>
  )
}

/** Rounded-square tinted icon container used on the metric cards. */
export function IconTile({ icon: Icon, tone = 'brand', size = 40 }: { icon: PhIcon; tone?: 'brand' | 'good' | 'bad' | 'warn'; size?: number }) {
  const cls =
    tone === 'good' ? 'bg-goodbg text-good' : tone === 'bad' ? 'bg-badbg text-bad' : tone === 'warn' ? 'bg-amber-100 text-warn' : 'bg-brand/10 text-brand'
  return (
    <div className={`grid shrink-0 place-items-center rounded-2xl ${cls}`} style={{ width: size, height: size }}>
      <Icon size={size * 0.5} weight="bold" />
    </div>
  )
}

export function Spinner() {
  return (
    <div className="grid place-items-center py-16 text-muted">
      <CircleNotch size={26} className="animate-spin" weight="bold" />
    </div>
  )
}

export function Empty({ text }: { text: string }) {
  return <div className="rounded-xl2 bg-surface/70 px-4 py-8 text-center text-sm text-muted">{text}</div>
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-6">
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="text-base font-extrabold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

/** Minimal area sparkline. */
export function Sparkline({ data, color, fill }: { data: number[]; color: string; fill?: string }) {
  const w = 280
  const h = 48
  const max = Math.max(1, ...data)
  const step = data.length > 1 ? w / (data.length - 1) : w
  const pts = data.map((v, i) => [i * step, h - (v / max) * (h - 8) - 4] as const)
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const area = `0,${h} ${line} ${w},${h}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-12 w-full">
      {fill && <polygon points={area} fill={fill} opacity={0.65} />}
      <polyline points={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Bar({ pct, color = 'bg-brand' }: { pct: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-line">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  )
}
