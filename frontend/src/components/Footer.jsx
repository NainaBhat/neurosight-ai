export default function Footer({ navigate }) {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="footer">
      <div className="footer__main">
        <div className="footer__brand">
          <div className="footer__logo">
            <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="18" cy="18" r="17" stroke="#60a5fa" strokeWidth="2"/>
              <path d="M10 18C10 13.58 13.58 10 18 10C20.4 10 22.57 11.03 24.07 12.7" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round"/>
              <path d="M26 18C26 22.42 22.42 26 18 26C15.6 26 13.43 24.97 11.93 23.3" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="18" cy="18" r="3.5" fill="#60a5fa"/>
              <path d="M18 10V7M18 29V26M10 18H7M29 18H26" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>NeuroSight AI</span>
          </div>
          <p>
            NeuroSight AI delivers AI-powered preliminary classification of brain MRI scans using
            an ensemble of VGG16 and EfficientNetB0 models. Our mission: empower healthcare professionals
            with intelligent diagnostic assistance.
          </p>
          <p className="footer__tech">
            Built with React · Python · Flask · TensorFlow · MongoDB Atlas · Vercel · Render
          </p>
        </div>

        <div className="footer__links">
          <h4>Quick Links</h4>
          <div className="footer__divider" />
          <nav>
            <button onClick={() => scrollTo('hero')}>Home</button>
            <button onClick={() => scrollTo('about')}>About</button>
            <button onClick={() => scrollTo('detection')}>Detection</button>
            <button onClick={() => navigate('login')}>Login</button>
            <button onClick={() => navigate('signup')}>Signup</button>
          </nav>
        </div>

        <div className="footer__social">
          <h4>Follow Us</h4>
          <div className="footer__divider" />
          <div className="social-icons">
            <a href="https://github.com/nainabhat" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <a href="https://www.linkedin.com/in/naina-bhat/ " target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a href="https://twitter.com/nainabhat" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>

          <h4 style={{ marginTop: '1.5rem' }}>Contact Us</h4>
          <div className="footer__divider" />
          <div className="contact-links">
            <a href="mailto:nainabhat@example.com" className="contact-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              nainabhat@example.com
            </a>
            <a href="tel:+919876543210" className="contact-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.1a16 16 0 006 6l.46-.46a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
              +91 98765 43210
            </a>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <p>© 2026 NeuroSight AI — Developed by <strong>Naina Bhat</strong></p>
        <p>Not a medical device. For research and educational purposes only.</p>
      </div>
    </footer>
  )
}
