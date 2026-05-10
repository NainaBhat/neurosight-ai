import { useState } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'

// ✅ Your backend URL — change if you deploy later
const API_URL = 'http://localhost:5000'

export default function LoginPage({ navigate }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.email || !form.password) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    try {
      // ✅ Call your backend login endpoint
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Login failed. Please try again.')
        return
      }

      // ✅ Save token and user info
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      navigate('home')   // redirect to home after login

    } catch (err) {
      setError('Cannot reach the server. Make sure server.js is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <Navbar navigate={navigate} />
      <div className="auth-page">
        <div className="auth-left">
          <div className="auth-brain-icon">
            <svg width="100" height="100" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="17" stroke="#2196f3" strokeWidth="1.5"/>
              <path d="M10 18C10 13.58 13.58 10 18 10C20.4 10 22.57 11.03 24.07 12.7" stroke="#2196f3" strokeWidth="2" strokeLinecap="round"/>
              <path d="M26 18C26 22.42 22.42 26 18 26C15.6 26 13.43 24.97 11.93 23.3" stroke="#2196f3" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="18" cy="18" r="3.5" fill="#2196f3"/>
              <path d="M18 10V7M18 29V26M10 18H7M29 18H26" stroke="#2196f3" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="auth-left__title">NeuroSight AI</h2>
          <p className="auth-left__sub">Welcome back! Please log in to access your account and utilize our advanced MRI analysis tools.</p>
        </div>

        <div className="auth-form-card">
          <h2 className="auth-form__title">Login</h2>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="form-input"
                  style={{ paddingRight: '2.5rem' }}
                />
                {/* Eye toggle button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', color: '#888', padding: 0
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="button" className="auth-forgot">Forgot Password?</button>

            {error && <div className="alert alert--error">{error}</div>}

            <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
              {loading ? <><span className="spinner" /> Logging in…</> : 'Login'}
            </button>

            <p className="auth-switch">
              Don&apos;t have an account?{' '}
              <button type="button" onClick={() => navigate('signup')} className="auth-switch__link">
                Sign Up
              </button>
            </p>
          </form>
        </div>
      </div>
      <Footer navigate={navigate} />
    </div>
  )
}
