import { useEffect, useState } from 'react'
import { CurrencyCircleDollar, ChartLineUp, WarningCircle } from '@phosphor-icons/react'
import { loadFinance, money, shortDate, type Finance as FinanceData } from '@/lib/data'
import { IconTile, Spinner, Section, Empty, type PhIcon } from '@/components/ui'

const METHOD_AR: Record<string, string> = {
  cash: 'نقدي',
  vodafone_cash: 'فودافون كاش',
  instapay: 'إنستاباي',
  other: 'أخرى',
}

export default function Finance() {
  const [d, setD] = useState<FinanceData | null>(null)
  useEffect(() => {
    loadFinance().then(setD)
  }, [])

  return (
    <div>
      <h1 className="pt-1 text-2xl font-extrabold">المالية</h1>
      {!d ? (
        <Spinner />
      ) : (
        <>
          <div className="mt-5 grid grid-cols-1 gap-3">
            <Stat label="دخل اليوم" value={money(d.incomeToday)} icon={CurrencyCircleDollar} tone="good" />
            <Stat label="دخل الشهر" value={money(d.incomeMonth)} icon={ChartLineUp} tone="brand" />
          </div>

          <div className="card mt-3 flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <IconTile icon={WarningCircle} tone="bad" size={44} />
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-muted">مبالغ متأخرة (تقديري)</div>
                <div className="mt-0.5 text-2xl font-extrabold text-bad">{money(d.overdueEstimate)}</div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-black">{d.overdueCount}</div>
              <div className="text-[11px] text-muted">طالب</div>
            </div>
          </div>

          <Section title="آخر المدفوعات">
            {d.lastPayments.length === 0 ? (
              <Empty text="لا توجد مدفوعات" />
            ) : (
              <div className="flex flex-col gap-2">
                {d.lastPayments.map((p) => (
                  <div key={p.id} className="card flex items-center justify-between p-4">
                    <div>
                      <div className="font-bold">{p.name}</div>
                      <div className="text-xs text-muted">
                        {shortDate(p.date)}
                        {p.method ? ` · ${METHOD_AR[p.method] ?? p.method}` : ''}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="font-extrabold text-good">{money(p.amount)}</div>
                      <div className="font-mono text-[10px] text-muted">{p.trx}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  )
}

function Stat({ label, value, icon, tone }: { label: string; value: string; icon: PhIcon; tone: 'good' | 'brand' }) {
  return (
    <div className="card flex items-center justify-between p-4">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wide text-muted">{label}</div>
        <div className="mt-1 text-2xl font-extrabold">{value}</div>
      </div>
      <IconTile icon={icon} tone={tone} size={44} />
    </div>
  )
}
