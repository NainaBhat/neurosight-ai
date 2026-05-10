import { useState, useEffect } from 'react'

export default function Navbar({ navigate }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id) => {
    setMenuOpen(false)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        {/* Logo */}
        <button className="navbar__logo" onClick={() => scrollTo('hero')}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="18" cy="18" r="17" stroke="#2196f3" strokeWidth="2"/>
            <path d="M10 18C10 13.58 13.58 10 18 10C20.4 10 22.57 11.03 24.07 12.7" stroke="#2196f3" strokeWidth="2" strokeLinecap="round"/>
            <path d="M26 18C26 22.42 22.42 26 18 26C15.6 26 13.43 24.97 11.93 23.3" stroke="#2196f3" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="18" cy="18" r="3.5" fill="#2196f3"/>
            <path d="M18 10V7M18 29V26M10 18H7M29 18H26" stroke="#2196f3" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M12.93 12.93L10.81 10.81M25.07 25.07L22.95 22.95M12.93 23.07L10.81 25.19M25.07 10.93L22.95 13.05" stroke="#2196f3" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span className="navbar__brand">NeuroSight AI</span>
        </button>

        {/* Desktop links */}
        <div className="navbar__links">
          <button onClick={() => scrollTo('hero')} className="nav-link">Home</button>
          <button onClick={() => scrollTo('about')} className="nav-link">About</button>
          <button onClick={() => scrollTo('detection')} className="nav-link">Detection</button>
          <button onClick={() => navigate('login')} className="nav-link">Login</button>
          <button onClick={() => navigate('signup')} className="nav-link nav-link--cta">Signup</button>
        </div>

        {/* Mobile hamburger */}
        <button className="navbar__hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <span className={`hamburger-line ${menuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${menuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${menuOpen ? 'open' : ''}`}></span>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="navbar__mobile-menu">
          <button onClick={() => scrollTo('hero')} className="mobile-nav-link">Home</button>
          <button onClick={() => scrollTo('about')} className="mobile-nav-link">About</button>
          <button onClick={() => scrollTo('detection')} className="mobile-nav-link">Detection</button>
          <button onClick={() => { navigate('login'); setMenuOpen(false) }} className="mobile-nav-link">Login</button>
          <button onClick={() => { navigate('signup'); setMenuOpen(false) }} className="mobile-nav-link">Signup</button>
        </div>
      )}
    </nav>
  )
}
