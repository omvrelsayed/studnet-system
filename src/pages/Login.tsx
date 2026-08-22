import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'

/** Bare username → the email Supabase Auth expects (matches the main system). */
function usernameToEmail(u: string) {
  return u.includes('@') ? u.trim() : `${u.trim()}@zakzoky.com`
}

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    })
    if (error) setError('اسم المستخدم أو كلمة المرور غير صحيحة')
    setBusy(false)
  }

  return (
    <div className="grid min-h-full place-items-center p-6">
      <div className="card w-full max-w-sm p-7">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand text-xl font-black text-white">
            د
          </div>
          <div className="text-xl font-extrabold">لوحة المتابعة</div>
          <div className="mt-1 text-xs text-muted">نظام إدارة الطلاب — مستر محمود الزقزوقي</div>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3.5">
          <div>
            <label className="mb-1 block text-sm font-bold">اسم المستخدم</label>
            <input
              dir="ltr"
              className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-start outline-none focus:border-brand"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold">كلمة المرور</label>
            <input
              type="password"
              dir="ltr"
              className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-start outline-none focus:border-brand"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <div className="text-sm font-semibold text-bad">{error}</div>}
          <button
            type="submit"
            disabled={busy}
            className="mt-1 rounded-xl bg-brand py-2.5 font-bold text-white transition hover:bg-brand-600 disabled:opacity-60"
          >
            {busy ? 'جارٍ الدخول…' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  )
}
