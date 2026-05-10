import { useState } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'

// ✅ Your backend URL — change if you deploy later
const API_URL = 'https://neurosight-ai-gj77.onrender.com'

export default function SignupPage({ navigate }) {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Frontend validation
    if (!form.username || !form.email || !form.password || !form.confirm) {
      setError('Please fill in all fields.')
      return
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      // ✅ Call your backend signup endpoint
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Server returned an error (e.g. email already used)
        setError(data.message || 'Signup failed. Please try again.')
        return
      }

      // ✅ Save token to localStorage so the user stays logged in
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      setSuccess('Account created! Redirecting…')
      setTimeout(() => navigate('home'), 1500)   // go to home after signup

    } catch (err) {
      // Network error — is server.js running?
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
          <p className="auth-left__sub">Unlock the power of AI for automated classification of neurological disorders in MRI scans. Create your account to get started.</p>
        </div>

        <div className="auth-form-card">
          <h2 className="auth-form__title">Create Account</h2>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="Choose a username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
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
              <input
                type="password"
                placeholder="Create a strong password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Re-enter your password"
                value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                className="form-input"
              />
            </div>

            {error   && <div className="alert alert--error">{error}</div>}
            {success && <div className="alert alert--success">{success}</div>}

            <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
              {loading ? <><span className="spinner" /> Creating account…</> : 'Sign Up'}
            </button>

            <p className="auth-switch">
              Already have an account?{' '}
              <button type="button" onClick={() => navigate('login')} className="auth-switch__link">
                Log In
              </button>
            </p>
          </form>
        </div>
      </div>
      <Footer navigate={navigate} />
    </div>
  )
}
