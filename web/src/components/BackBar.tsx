import { CaretRight } from '@phosphor-icons/react'

export default function BackBar({
  title,
  subtitle,
  onBack,
}: {
  title: string
  subtitle?: string
  onBack: () => void
}) {
  return (
    <div className="mb-4 flex items-center gap-2 pt-1">
      <button
        onClick={onBack}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface shadow-card active:scale-95"
        aria-label="رجوع"
      >
        {/* RTL: back points to the right */}
        <CaretRight size={18} weight="bold" />
      </button>
      <div className="leading-tight">
        <div className="text-lg font-extrabold">{title}</div>
        {subtitle ? <div className="text-xs text-muted">{subtitle}</div> : null}
      </div>
    </div>
  )
}
