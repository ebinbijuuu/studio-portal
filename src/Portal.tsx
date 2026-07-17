import { FormEvent, useCallback, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'

type Enquiry = { id: string; created_at: string; name: string; email: string; service: string; message: string; status: string }
type Props = { user: User | null; onClose: () => void }

export default function Portal({ user, onClose }: Props) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [items, setItems] = useState<Enquiry[]>([])
  const [role, setRole] = useState<'client' | 'admin'>('client')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const loadPortal = useCallback(async () => {
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('role').single()
    const currentRole = profile?.role === 'admin' ? 'admin' : 'client'
    setRole(currentRole)
    const { data, error } = await supabase.from('enquiries').select('*').order('created_at', { ascending: false })
    if (error) setNotice('Your account is ready, but there are no linked enquiries yet. Sign in before submitting a new enquiry to see it here.')
    else setItems(data ?? [])
  }, [user])

  useEffect(() => { void loadPortal() }, [loadPortal])

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice('')
    const values = new FormData(event.currentTarget)
    const email = String(values.get('email')); const password = String(values.get('password'))
    const result = mode === 'sign-in'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { display_name: String(values.get('name') ?? '') } } })
    setBusy(false)
    setNotice(result.error ? result.error.message : mode === 'sign-up' ? 'Check your inbox to confirm your account, then sign in.' : '')
  }

  async function cancel(id: string) {
    await supabase.rpc('cancel_own_enquiry', { p_enquiry_id: id }); await loadPortal()
  }
  async function changeStatus(id: string, status: string) {
    await supabase.from('enquiries').update({ status }).eq('id', id); await loadPortal()
  }

  return <div className="portal-backdrop"><section className="portal" role="dialog" aria-modal="true" aria-label="Client portal"><button className="close" onClick={onClose}>×</button>
    <p className="eyebrow">Noir & Light</p>
    {!user ? <div className="auth"><h2>{mode === 'sign-in' ? <>Welcome<br /><em>back.</em></> : <>Create your<br /><em>account.</em></>}</h2><p>Sign in to keep track of your studio enquiries.</p>
      <form onSubmit={authenticate}>{mode === 'sign-up' && <label>Your name<input name="name" required /></label>}<label>Email address<input name="email" type="email" required /></label><label>Password<input name="password" type="password" minLength={6} required /></label>{notice && <p className="form-error">{notice}</p>}<button className="dark-button" disabled={busy}>{busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}</button></form>
      <button className="switch" onClick={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setNotice('') }}>{mode === 'sign-in' ? 'New here? Create an account' : 'Already have an account? Sign in'}</button>
    </div> : <div className="dashboard"><div className="portal-heading"><div><h2>{role === 'admin' ? <>Studio<br /><em>desk.</em></> : <>Your<br /><em>enquiries.</em></>}</h2><p>{user.email}</p></div><button className="switch" onClick={() => supabase.auth.signOut()}>Sign out</button></div>
      {notice && <p className="portal-note">{notice}</p>}
      <div className="booking-list">{items.length ? items.map(item => <article key={item.id} className="booking-row"><div><p className="booking-service">{item.service}</p><h3>{role === 'admin' ? item.name : 'Your enquiry'}</h3><p>{new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · {role === 'admin' ? item.email : item.message}</p></div><div className="status-area">{role === 'admin' ? <select value={item.status} aria-label="Booking status" onChange={e => void changeStatus(item.id, e.target.value)}><option value="new">New</option><option value="replied">Replied</option><option value="consultation">Consultation</option><option value="booked">Booked</option><option value="declined">Declined</option></select> : <><span className={`status ${item.status}`}>{item.status}</span>{item.status === 'new' && <button className="switch" onClick={() => void cancel(item.id)}>Cancel</button>}</>}</div></article>) : <p className="empty">No enquiries here yet. Sign in first, then send an enquiry from the studio site.</p>}</div>
    </div>}
  </section></div>
}
