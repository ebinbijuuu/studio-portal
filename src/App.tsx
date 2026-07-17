import { FormEvent, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import Portal from './Portal'

const Arrow = () => <span aria-hidden="true">↗</span>

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [portalOpen, setPortalOpen] = useState(false)

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    setIsSubmitting(true)
    const form = new FormData(event.currentTarget)
    const { error } = await supabase.from('enquiries').insert({
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      service: String(form.get('service') ?? ''),
      message: String(form.get('message') ?? ''),
      client_id: user?.id ?? null,
    })
    setIsSubmitting(false)
    if (error) {
      setFormError('We could not send your enquiry just yet. Please try again.')
      return
    }
    setSubmitted(true)
  }

  return <>
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Noir and Light Studio home"><i>N</i><span>NOIR<br />& LIGHT</span></a>
      <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="nav">Menu <span>{menuOpen ? '−' : '+'}</span></button>
      <nav id="nav" className={menuOpen ? 'open' : ''}>
        <a href="#work">Our work</a><a href="#experience">The experience</a><a href="#journal">Journal</a>
        <button className="text-button" onClick={() => setBookingOpen(true)}>Enquire <Arrow /></button><button className="portal-button" onClick={() => setPortalOpen(true)}>Client portal</button>
      </nav>
    </header>

    <main id="top">
      <section className="hero">
        <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
        <p className="eyebrow">London · Destination · Worldwide</p>
        <h1>For the moments<br /><em>that stay.</em></h1>
        <div className="hero-bottom"><p>Thoughtful, atmospheric photography for celebrations with soul.</p><button onClick={() => setBookingOpen(true)} className="circle-button" aria-label="Start an enquiry">↗</button></div>
        <p className="hero-index">01 — 04</p>
      </section>

      <section id="work" className="intro section-pad">
        <p className="eyebrow">A quiet kind of luxury</p>
        <div><h2>Images with a pulse.</h2><p className="lead">Noir & Light is a London-based studio documenting weddings and intimate gatherings with an editorial eye and a human heart.</p><a className="arrow-link" href="#experience">Discover our approach <Arrow /></a></div>
      </section>

      <section className="gallery" aria-label="Selected photography">
        <article className="image-card card-cream"><div className="figure figure-one" /><p>01 <span>— A room full of light</span></p></article>
        <article className="image-card card-brown"><div className="figure figure-two" /><p>02 <span>— The in-between</span></p></article>
        <article className="image-card card-night"><div className="figure figure-three" /><p>03 <span>— After dark</span></p></article>
      </section>

      <section id="experience" className="services section-pad">
        <div><p className="eyebrow">Made for remembering</p><h2>What we make<br />space for.</h2></div>
        <div className="service-list">
          <article><span>01</span><h3>Weddings</h3><p>Full-day storytelling for modern celebrations, at home and abroad.</p><button onClick={() => setBookingOpen(true)}>Enquire <Arrow /></button></article>
          <article><span>02</span><h3>Editorial events</h3><p>Atmospheric coverage for dinners, launches and intimate occasions with character.</p><button onClick={() => setBookingOpen(true)}>Enquire <Arrow /></button></article>
          <article><span>03</span><h3>Portraits</h3><p>Unhurried editorial portraits for people, founders and creative brands.</p><button onClick={() => setBookingOpen(true)}>Enquire <Arrow /></button></article>
        </div>
      </section>

      <section id="journal" className="quote section-pad"><p className="eyebrow">Kind words</p><blockquote>“They noticed every small, beautiful thing — and somehow made us feel completely ourselves.”</blockquote><p>— Olivia & Felix, Florence</p></section>

      <section className="cta section-pad"><p className="eyebrow">Your story, thoughtfully told</p><h2>Begin with<br /><em>a conversation.</em></h2><button className="circle-button" onClick={() => setBookingOpen(true)} aria-label="Start an enquiry">↗</button></section>
    </main>
    <footer><a className="brand" href="#top"><i>N</i><span>NOIR<br />& LIGHT</span></a><p>© 2026 Noir & Light Studio</p><a href="mailto:hello@noirandlight.studio">hello@noirandlight.studio</a></footer>

    {portalOpen && <Portal user={user} onClose={() => setPortalOpen(false)} />}

    {bookingOpen && <div className="modal-backdrop" role="presentation"><section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title">
      <button className="close" onClick={() => { setBookingOpen(false); setSubmitted(false); setFormError('') }} aria-label="Close enquiry form">×</button>
      {submitted ? <div className="success"><p className="eyebrow">Message received</p><h2>We can't wait<br /><em>to hear more.</em></h2><p>Thank you. We’ll be in touch within two working days.</p><button className="dark-button" onClick={() => setBookingOpen(false)}>Return to the studio</button></div> : <><p className="eyebrow">Start an enquiry</p><h2 id="booking-title">Tell us<br /><em>everything.</em></h2><form onSubmit={submitBooking}><label>Your name<input required name="name" placeholder="First and last name" /></label><label>Email address<input required type="email" name="email" placeholder="you@example.com" /></label><label>What are you celebrating?<select name="service"><option>Wedding</option><option>Editorial events</option><option>Portraits</option><option>Something else</option></select></label><label>Tell us a little more<textarea required minLength={10} name="message" rows={3} placeholder="Date, location, and what matters most to you…" /></label>{formError && <p className="form-error" role="alert">{formError}</p>}<button className="dark-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Sending…' : <>Send enquiry <Arrow /></>}</button></form></>}
    </section></div>}
  </>
}
