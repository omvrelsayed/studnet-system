import { supabase } from './supabase'

/* --------------------------------- helpers -------------------------------- */
const pad = (n: number) => String(n).padStart(2, '0')
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const AR_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

export type Period = 'today' | 'week' | 'month'
export const PERIOD_LABEL: Record<Period, string> = { today: 'اليوم', week: 'الأسبوع', month: 'الشهر' }

function rangeFor(p: Period) {
  const now = new Date()
  if (p === 'today') return { from: iso(now), to: iso(now) }
  if (p === 'week') return { from: iso(new Date(Date.now() - 6 * 86400000)), to: iso(now) }
  const s = new Date(now.getFullYear(), now.getMonth(), 1)
  const e = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { from: iso(s), to: iso(e) }
}

async function sumPayments(from: string, to: string) {
  const { data } = await supabase
    .from('finance_transactions')
    .select('amount, type')
    .gte('occurred_on', from)
    .lte('occurred_on', to)
  return (data ?? []).reduce((s, r: any) => s + (r.type === 'refund' ? -1 : 1) * Number(r.amount || 0), 0)
}

async function sumExpenses(p: Period, from: string, to: string) {
  const { data: once } = await supabase
    .from('expenses').select('amount').eq('kind', 'onetime').gte('spent_on', from).lte('spent_on', to)
  let total = (once ?? []).reduce((s, r: any) => s + Number(r.amount || 0), 0)
  if (p === 'month') {
    const { data: monthly } = await supabase.from('expenses').select('amount').eq('kind', 'monthly')
    total += (monthly ?? []).reduce((s, r: any) => s + Number(r.amount || 0), 0)
  }
  return total
}

/** active students that have NOT paid anything in the current calendar month (id → fee). */
async function overdueStudents() {
  const { from, to } = rangeFor('month')
  const [{ data: studs }, { data: grades }, { data: pays }] = await Promise.all([
    supabase.from('students').select('id, full_name, photo_url, custom_fee, grade_id').eq('status', 'active'),
    supabase.from('grades').select('id, fee_amount'),
    supabase.from('finance_transactions').select('student_id').eq('type', 'payment').gte('occurred_on', from).lte('occurred_on', to),
  ])
  const feeOf = new Map((grades ?? []).map((g: any) => [g.id, Number(g.fee_amount || 0)]))
  const paid = new Set((pays ?? []).map((p: any) => p.student_id).filter(Boolean))
  const list = (studs ?? [])
    .filter((s: any) => !paid.has(s.id))
    .map((s: any) => ({
      id: s.id,
      name: s.full_name,
      photo: s.photo_url as string | null,
      fee: s.custom_fee != null ? Number(s.custom_fee) : (feeOf.get(s.grade_id) ?? 0),
    }))
  return list
}

/* ------------------------------- OVERVIEW -------------------------------- */
export type ClassCard = {
  key: string
  sessionId: string | null
  group: string
  grade: string
  start: string
  end: string | null
  total: number
  present: number
  absent: number
  started: boolean
}

export type Overview = {
  studentsCount: number
  present: number
  absent: number
  income: number
  expenses: number
  periodLabel: string
  classes: ClassCard[]
  alert: string | null
}

export async function loadClasses(): Promise<ClassCard[]> {
  const dow = new Date().getDay()
  const today = iso(new Date())
  const [{ data: slots }, { data: sess }] = await Promise.all([
    supabase
      .from('lesson_slots')
      .select('id, start_time, end_time, group_id, groups(name, grades(name))')
      .eq('day_of_week', dow)
      .order('start_time'),
    supabase.from('sessions').select('id, group_id').eq('session_date', today),
  ])
  const sessByGroup = new Map((sess ?? []).map((s: any) => [s.group_id, s.id]))
  const groupIds = [...new Set((slots ?? []).map((s: any) => s.group_id))]
  const sessionIds = (sess ?? []).map((s: any) => s.id)

  const [{ data: studs }, { data: att }] = await Promise.all([
    groupIds.length
      ? supabase.from('students').select('group_id').eq('status', 'active').in('group_id', groupIds)
      : Promise.resolve({ data: [] as any[] }),
    sessionIds.length
      ? supabase.from('attendance').select('session_id, status').in('session_id', sessionIds)
      : Promise.resolve({ data: [] as any[] }),
  ])
  const totalByGroup = new Map<string, number>()
  for (const s of studs ?? []) totalByGroup.set(s.group_id, (totalByGroup.get(s.group_id) ?? 0) + 1)
  const presBySess = new Map<string, number>()
  const absBySess = new Map<string, number>()
  for (const a of att ?? []) {
    const m = a.status === 'present' ? presBySess : absBySess
    m.set(a.session_id, (m.get(a.session_id) ?? 0) + 1)
  }

  return (slots ?? []).map((s: any) => {
    const sid = sessByGroup.get(s.group_id) ?? null
    return {
      key: s.id,
      sessionId: sid,
      group: s.groups?.name ?? '—',
      grade: s.groups?.grades?.name ?? '',
      start: String(s.start_time).slice(0, 5),
      end: s.end_time ? String(s.end_time).slice(0, 5) : null,
      total: totalByGroup.get(s.group_id) ?? 0,
      present: sid ? presBySess.get(sid) ?? 0 : 0,
      absent: sid ? absBySess.get(sid) ?? 0 : 0,
      started: !!sid,
    }
  })
}

export async function loadOverview(period: Period): Promise<Overview> {
  const { from, to } = rangeFor(period)
  const [studentsRes, attRes, income, expenses, classes] = await Promise.all([
    supabase.from('students').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('attendance').select('status, sessions!inner(session_date)').gte('sessions.session_date', from).lte('sessions.session_date', to),
    sumPayments(from, to),
    sumExpenses(period, from, to),
    loadClasses(),
  ])
  let present = 0
  let absent = 0
  for (const a of (attRes.data ?? []) as any[]) (a.status === 'present' ? present++ : absent++)
  const absentToday = classes.reduce((s, c) => s + c.absent, 0)
  return {
    studentsCount: studentsRes.count ?? 0,
    present,
    absent,
    income,
    expenses,
    periodLabel: PERIOD_LABEL[period],
    classes,
    alert: absentToday > 0 ? `غاب اليوم ${absentToday} طالب — يُفضّل المتابعة` : null,
  }
}

/* --------------------------------- HOME ---------------------------------- */
export type Home = {
  teacherName: string
  photo: string | null
  revenue: number
  revenuePrevPct: number | null
  netProfit: number
  costs: number
  activeStudents: number
  newThisMonth: number
  attendanceRate: number | null
  presentToday: number
  absentToday: number
  attendanceSeries: number[]
  absenceSeries: number[]
}

export async function loadHome(): Promise<Home> {
  const now = new Date()
  const today = iso(now)
  const weekAgo = iso(new Date(Date.now() - 6 * 86400000))
  const m = rangeFor('month')
  const ps = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const pe = new Date(now.getFullYear(), now.getMonth(), 0)
  const [teacher, revenue, prevRev, costs, activeRes, newRes, weekAtt] = await Promise.all([
    loadTeacher(),
    sumPayments(m.from, m.to),
    sumPayments(iso(ps), iso(pe)),
    sumExpenses('month', m.from, m.to),
    supabase.from('students').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('students').select('id', { count: 'exact', head: true }).eq('status', 'active').gte('enrolled_at', m.from).lte('enrolled_at', m.to),
    supabase.from('attendance').select('status, sessions!inner(session_date)').gte('sessions.session_date', weekAgo).lte('sessions.session_date', today),
  ])
  const days = Array.from({ length: 7 }, (_, i) => iso(new Date(Date.now() - (6 - i) * 86400000)))
  const pres = new Map(days.map((d) => [d, 0]))
  const abs = new Map(days.map((d) => [d, 0]))
  let wkP = 0
  let wkT = 0
  let presentToday = 0
  let absentToday = 0
  for (const r of (weekAtt.data ?? []) as any[]) {
    const d = r.sessions?.session_date
    const p = r.status === 'present'
    const map = p ? pres : abs
    map.set(d, (map.get(d) ?? 0) + 1)
    wkT++
    if (p) wkP++
    if (d === today) p ? presentToday++ : absentToday++
  }
  return {
    teacherName: teacher.name,
    photo: teacher.photo,
    revenue,
    revenuePrevPct: prevRev > 0 ? ((revenue - prevRev) / prevRev) * 100 : null,
    netProfit: revenue - costs,
    costs,
    activeStudents: activeRes.count ?? 0,
    newThisMonth: newRes.count ?? 0,
    attendanceRate: wkT > 0 ? (wkP / wkT) * 100 : null,
    presentToday,
    absentToday,
    attendanceSeries: days.map((d) => pres.get(d) ?? 0),
    absenceSeries: days.map((d) => abs.get(d) ?? 0),
  }
}

/* -------------------------------- CLASSES -------------------------------- */
export type Person = { id: string; name: string; photo: string | null; makeup?: boolean }
export async function loadClassDetail(sessionId: string): Promise<{ present: Person[]; absent: Person[] }> {
  const { data } = await supabase
    .from('attendance')
    .select('status, is_makeup, students(id, full_name, photo_url)')
    .eq('session_id', sessionId)
  const present: Person[] = []
  const absent: Person[] = []
  for (const r of (data ?? []) as any[]) {
    const p: Person = { id: r.students?.id, name: r.students?.full_name ?? '—', photo: r.students?.photo_url ?? null, makeup: r.is_makeup }
    ;(r.status === 'present' ? present : absent).push(p)
  }
  present.sort((a, b) => a.name.localeCompare(b.name, 'ar'))
  absent.sort((a, b) => a.name.localeCompare(b.name, 'ar'))
  return { present, absent }
}

/* -------------------------------- STUDENTS ------------------------------- */
export type StudentListItem = { id: string; name: string; group: string; photo: string | null }
export async function loadStudents(search: string): Promise<StudentListItem[]> {
  let q = supabase
    .from('students')
    .select('id, full_name, photo_url, groups(name)')
    .eq('status', 'active')
    .order('full_name')
    .limit(200)
  if (search.trim()) q = q.ilike('full_name', `%${search.trim()}%`)
  const { data } = await q
  return (data ?? []).map((s: any) => ({ id: s.id, name: s.full_name, group: s.groups?.name ?? '—', photo: s.photo_url ?? null }))
}

export type StudentProfile = {
  id: string
  name: string
  photo: string | null
  group: string
  grade: string
  presentCount: number
  absentCount: number
  paymentStatus: 'مدفوع' | 'جزئي' | 'متأخر'
  monthPaid: number
  fee: number
  lastPayment: { amount: number; date: string } | null
  lastSessions: { date: string; present: boolean; makeup: boolean }[]
}
export async function loadStudentProfile(id: string): Promise<StudentProfile> {
  const { from, to } = rangeFor('month')
  const [stuRes, presRes, absRes, monthPays, lastPay, sessAtt] = await Promise.all([
    supabase.from('students').select('full_name, photo_url, custom_fee, groups(name), grades(name, fee_amount)').eq('id', id).maybeSingle(),
    supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('student_id', id).eq('status', 'present'),
    supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('student_id', id).eq('status', 'absent'),
    supabase.from('finance_transactions').select('amount, type').eq('student_id', id).gte('occurred_on', from).lte('occurred_on', to),
    supabase.from('finance_transactions').select('amount, occurred_on').eq('student_id', id).eq('type', 'payment').order('occurred_on', { ascending: false }).limit(1),
    supabase.from('attendance').select('status, is_makeup, sessions(session_date)').eq('student_id', id).limit(50),
  ])
  const stu: any = stuRes.data ?? {}
  const fee = stu.custom_fee != null ? Number(stu.custom_fee) : Number(stu.grades?.fee_amount ?? 0)
  const monthPaid = (monthPays.data ?? []).reduce((s, r: any) => s + (r.type === 'refund' ? -1 : 1) * Number(r.amount || 0), 0)
  const status: StudentProfile['paymentStatus'] = monthPaid <= 0 ? 'متأخر' : monthPaid >= fee && fee > 0 ? 'مدفوع' : 'جزئي'
  const lp = (lastPay.data ?? [])[0] as any
  const lastSessions = ((sessAtt.data ?? []) as any[])
    .map((r) => ({ date: r.sessions?.session_date as string, present: r.status === 'present', makeup: !!r.is_makeup }))
    .filter((r) => r.date)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6)
  return {
    id,
    name: stu.full_name ?? '—',
    photo: stu.photo_url ?? null,
    group: stu.groups?.name ?? '—',
    grade: stu.grades?.name ?? '',
    presentCount: presRes.count ?? 0,
    absentCount: absRes.count ?? 0,
    paymentStatus: status,
    monthPaid,
    fee,
    lastPayment: lp ? { amount: Number(lp.amount), date: lp.occurred_on } : null,
    lastSessions,
  }
}

/* -------------------------------- FINANCE -------------------------------- */
export type PaymentRow = { id: string; trx: string; name: string; amount: number; date: string; method: string | null }
export type Finance = {
  incomeToday: number
  incomeMonth: number
  overdueCount: number
  overdueEstimate: number
  lastPayments: PaymentRow[]
}
export async function loadFinance(): Promise<Finance> {
  const t = rangeFor('today')
  const m = rangeFor('month')
  const [incomeToday, incomeMonth, overdue, last] = await Promise.all([
    sumPayments(t.from, t.to),
    sumPayments(m.from, m.to),
    overdueStudents(),
    supabase
      .from('finance_transactions')
      .select('id, trx_no, amount, occurred_on, method, student_name')
      .eq('type', 'payment')
      .order('occurred_on', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(8),
  ])
  return {
    incomeToday,
    incomeMonth,
    overdueCount: overdue.length,
    overdueEstimate: overdue.reduce((s, o) => s + o.fee, 0),
    lastPayments: (last.data ?? []).map((r: any) => ({
      id: r.id,
      trx: r.trx_no ?? '—',
      name: r.student_name ?? 'طالب',
      amount: Number(r.amount),
      date: r.occurred_on,
      method: r.method,
    })),
  }
}

/* -------------------------------- MESSAGES ------------------------------- */
export type Messages = { sent: number; pending: number; failed: number; connected: boolean }
export async function loadMessages(): Promise<Messages> {
  const [sent, pending, failed] = await Promise.all([
    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
  ])
  return {
    sent: sent.count ?? 0,
    pending: pending.count ?? 0,
    failed: failed.count ?? 0,
    connected: typeof navigator === 'undefined' ? true : navigator.onLine,
  }
}

/* ----------------------------- NOTIFICATIONS ----------------------------- */
export type NotifItem = { id: string; kind: 'absent' | 'due' | 'failed' | 'ok'; text: string; tone: 'bad' | 'warn' | 'muted' }
export async function loadNotifications(): Promise<{ items: NotifItem[]; pendingBadge: number }> {
  const today = iso(new Date())
  const [{ data: sessToday }, overdue, { data: failedMsgs }, pending] = await Promise.all([
    supabase.from('sessions').select('id').eq('session_date', today),
    overdueStudents(),
    supabase.from('messages').select('id, students(full_name)').eq('status', 'failed').limit(10),
    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])
  const sessIds = (sessToday ?? []).map((s: any) => s.id)
  let absentToday: any[] = []
  if (sessIds.length) {
    const { data } = await supabase
      .from('attendance')
      .select('students(full_name)')
      .eq('status', 'absent')
      .in('session_id', sessIds)
    absentToday = data ?? []
  }
  const items: NotifItem[] = []
  for (const a of absentToday.slice(0, 8))
    items.push({ id: 'abs' + Math.random(), kind: 'absent', text: `غاب اليوم: ${a.students?.full_name ?? 'طالب'}`, tone: 'warn' })
  for (const o of overdue.slice(0, 8))
    items.push({ id: 'due' + o.id, kind: 'due', text: `دفعة متأخرة: ${o.name}`, tone: 'bad' })
  for (const f of (failedMsgs ?? []).slice(0, 8))
    items.push({ id: 'fail' + f.id, kind: 'failed', text: `فشل إرسال رسالة إلى ${(f as any).students?.full_name ?? 'ولي أمر'}`, tone: 'bad' })
  if (items.length === 0) items.push({ id: 'ok', kind: 'ok', text: 'لا توجد تنبيهات حالياً', tone: 'muted' })
  return { items, pendingBadge: (pending.count ?? 0) + (failedMsgs ?? []).length }
}

/* ------------------------------ header / misc ---------------------------- */
export async function loadTeacher() {
  const { data } = await supabase.from('teachers').select('full_name, photo_url').limit(1).maybeSingle()
  return { name: data?.full_name ?? 'أستاذ', photo: (data?.photo_url as string | null) ?? null }
}

/* ------------------------------- formatting ------------------------------- */
export function money(n: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' ج.م'
}
export function time12(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  const ap = h < 12 ? 'ص' : 'م'
  const h12 = h % 12 || 12
  return `${h12}:${pad(m)} ${ap}`
}
export function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'صباح الخير' : 'مساء الخير'
}
export const todayLabel = () => {
  const d = new Date()
  return `${AR_DAYS[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`
}
export function shortDate(s: string) {
  const [, mm, dd] = s.split('-')
  return `${dd}/${mm}`
}
export function firstName(full: string) {
  const parts = full.trim().split(/\s+/)
  if (['مستر', 'أستاذ', 'استاذ', 'م.', 'د.'].includes(parts[0]) && parts[1]) return parts[1]
  return parts[0] || full
}
