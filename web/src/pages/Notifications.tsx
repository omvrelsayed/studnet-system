import { useEffect, useState } from 'react'
import {
  UserMinus,
  Coins,
  WarningCircle,
  CheckCircle,
  WifiHigh,
  WifiSlash,
  SignOut,
  PaperPlaneTilt,
  Hourglass,
  XCircle,
} from '@phosphor-icons/react'
import { supabase } from '@/lib/supabase'
import { loadMessages, loadNotifications, type Messages, type NotifItem } from '@/lib/data'
import { Spinner, type PhIcon } from '@/components/ui'
import BackBar from '@/components/BackBar'

const KIND_ICON: Record<NotifItem['kind'], PhIcon> = {
  absent: UserMinus,
  due: Coins,
  failed: WarningCircle,
  ok: CheckCircle,
}

export default function Notifications({ onBack }: { onBack: () => void }) {
  const [msg, setMsg] = useState<Messages | null>(null)
  const [items, setItems] = useState<NotifItem[] | null>(null)

  useEffect(() => {
    loadMessages().then(setMsg)
    loadNotifications().then((n) => setItems(n.items))
  }, [])

  return (
    <div>
      <BackBar title="التنبيهات" onBack={onBack} />

      {/* Messages status */}
      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-extrabold">حالة الرسائل</div>
          <span
            className={`chip ${msg?.connected ? 'bg-goodbg text-good' : 'bg-badbg text-bad'}`}
          >
            {msg?.connected ? <WifiHigh size={14} weight="bold" /> : <WifiSlash size={14} weight="bold" />}
            {msg?.connected ? 'متصل' : 'غير متصل'}
          </span>
        </div>
        {!msg ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-3 gap-3 text-center">
            <MsgStat icon={PaperPlaneTilt} n={msg.sent} label="تم الإرسال" tone="text-good" />
            <MsgStat icon={Hourglass} n={msg.pending} label="في الانتظار" tone="text-warn" />
            <MsgStat icon={XCircle} n={msg.failed} label="فشل" tone="text-bad" />
          </div>
        )}
      </div>

      {/* Notifications list */}
      <div className="mt-4">
        <div className="mb-2 text-sm font-extrabold">أحدث التنبيهات</div>
        {!items ? (
          <Spinner />
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((n) => {
              const Icon = KIND_ICON[n.kind]
              const tone = n.tone === 'bad' ? 'text-bad' : n.tone === 'warn' ? 'text-warn' : 'text-good'
              return (
                <div key={n.id} className="card flex items-center gap-3 p-3.5">
                  <span className={tone}>
                    <Icon size={20} weight="bold" />
                  </span>
                  <span className="text-sm font-semibold">{n.text}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <button
        onClick={() => supabase.auth.signOut()}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl2 border border-line bg-surface py-3 text-sm font-bold text-bad active:scale-[0.99]"
      >
        <SignOut size={17} weight="bold" /> تسجيل الخروج
      </button>
    </div>
  )
}

function MsgStat({ icon: Icon, n, label, tone }: { icon: PhIcon; n: number; label: string; tone: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={tone}>
        <Icon size={20} weight="bold" />
      </span>
      <div className={`text-xl font-black ${tone}`}>{n}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  )
}
