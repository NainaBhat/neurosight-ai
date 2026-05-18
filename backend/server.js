require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const { spawn } = require('child_process')
const path = require('path')
const http = require('http')
 
const app = express()
app.use(cors())
app.use(express.json())
 
// ──────────────────────────────────────────────────────────────────────────────
// PYTHON FLASK STARTUP - Run Python app in background
// ──────────────────────────────────────────────────────────────────────────────
 
console.log('🐍 Starting Python Flask backend (models should be pre-downloaded)...')
 
// CRITICAL: Models should already be downloaded during build.
// If they're missing at runtime, Flask will start but return errors.
// This is intentional — allows graceful degradation.
 
// Start Flask immediately (models already in place)
const flaskProcess = spawn('python', ['app.py'], {
  cwd: __dirname,
  stdio: 'inherit',  // Show Flask logs in Express output
  env: {
    ...process.env,
    FLASK_ENV: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    FLASK_PORT: process.env.FLASK_PORT || '5000'
  }
})
 
flaskProcess.on('error', (err) => {
  console.error('❌ Failed to start Flask:', err)
})
 
flaskProcess.on('close', (code) => {
  if (code !== 0) {
    console.warn(`⚠️  Flask exited with code ${code}`)
  }
})
 
// Give Flask 5 seconds to start before Express starts accepting requests
const FLASK_STARTUP_DELAY = 5000
setTimeout(() => {
  console.log('✅ Flask startup delay complete, Express now accepting requests')
}, FLASK_STARTUP_DELAY)
 
// ─── Connect to MongoDB ───────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err))
 
// ─── User Schema ──────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
}, { timestamps: true })
 
const User = mongoose.model('User', userSchema)
 
// ─── SIGNUP Route ─────────────────────────────────────────────────────────────
// POST http://localhost:5000/api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body
 
    // Check if user already exists
    const existing = await User.findOne({ $or: [{ email }, { username }] })
    if (existing) {
      return res.status(400).json({ message: 'Username or email already in use.' })
    }
 
    // Hash the password
    const hashed = await bcrypt.hash(password, 10)
 
    // Save new user
    const user = await User.create({ username, email, password: hashed })
 
    // Create a token
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })
 
    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: { id: user._id, username: user.username, email: user.email }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
})
 
// ─── LOGIN Route ──────────────────────────────────────────────────────────────
// POST http://localhost:5000/api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
 
    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }
 
    // Check password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }
 
    // Create a token
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })
 
    res.json({
      message: 'Login successful!',
      token,
      user: { id: user._id, username: user.username, email: user.email }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
})
 
// ──────────────────────────────────────────────────────────────────────────────
// PROXY Routes to Python Flask Backend
// ──────────────────────────────────────────────────────────────────────────────
 
// Health check for Python backend
app.get('/api/health', (req, res) => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/health',
    method: 'GET',
    timeout: 15000  // ← INCREASED from 5000 to 15s (Flask model load can take time)
  }
 
  const proxyReq = http.request(options, (proxyRes) => {
    let data = ''
    proxyRes.on('data', (chunk) => data += chunk)
    proxyRes.on('end', () => {
      try {
        const parsed = JSON.parse(data)
        res.status(proxyRes.statusCode || 200).json(parsed)
      } catch {
        // If Flask returns non-JSON, return JSON error
        console.error('Flask /health returned invalid JSON:', data.substring(0, 200))
        res.status(502).json({ 
          error: 'Python backend returned invalid response',
          details: data.substring(0, 200)
        })
      }
    })
  })
 
  proxyReq.on('timeout', () => {
    proxyReq.abort()
    res.status(503).json({ 
      error: 'Python backend timeout (may still be loading models)',
      retry_after_seconds: 30
    })
  })
 
  proxyReq.on('error', (err) => {
    console.error('Health check proxy error:', err.message)
    res.status(503).json({ 
      error: 'Python backend unavailable',
      details: err.message,
      models: { vgg16: false, efficientnetb0: false }
    })
  })
 
  proxyReq.end()
})
 
// Forward MRI prediction requests to Python Flask
app.post('/api/predict', (req, res) => {
  // Forward multipart form-data to Flask
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/predict',
    method: 'POST',
    headers: {
      'Content-Type': req.headers['content-type'] || 'multipart/form-data'
    },
    timeout: 30000  // ← INCREASED from implicit 5s to 30s for inference
  }
 
  const proxyReq = http.request(options, (proxyRes) => {
    let data = ''
    proxyRes.on('data', (chunk) => { data += chunk })
    proxyRes.on('end', () => {
      try {
        const parsed = JSON.parse(data)
        res.status(proxyRes.statusCode || 200).json(parsed)
      } catch (e) {
        // If Flask returns non-JSON, return JSON error
        console.error('Flask /predict returned invalid JSON:', data.substring(0, 300))
        res.status(502).json({ 
          error: 'Invalid response from Python backend',
          details: data.substring(0, 300),
          type: 'InvalidJSONResponse'
        })
      }
    })
  })
 
  proxyReq.on('timeout', () => {
    proxyReq.abort()
    res.status(504).json({ 
      error: 'Prediction service timeout (inference taking too long)',
      details: 'Please try again with a smaller image or simpler MRI scan'
    })
  })
 
  proxyReq.on('error', (err) => {
    console.error('Predict proxy error:', err.message)
    res.status(503).json({ 
      error: 'Prediction service unavailable',
      details: err.message,
      type: 'ServiceUnavailable'
    })
  })
 
  req.pipe(proxyReq)
})
 
// ─────────────────────────────────────────────────────────────────────────────
// Start Express Server
// ─────────────────────────────────────────────────────────────────────────────
 
const PORT = process.env.PORT || 3000
 
app.listen(PORT, () => {
  console.log(`🚀 Express server running on http://localhost:${PORT}`)
  console.log(`📡 API routes:`)
  console.log(`   POST   /api/auth/signup`)
  console.log(`   POST   /api/auth/login`)
  console.log(`   GET    /api/health (checks Python backend)`)
  console.log(`   POST   /api/predict (MRI tumor detection)`)
})
 
