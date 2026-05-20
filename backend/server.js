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

console.log('🐍 Starting Python Flask backend...')

// First, download models (if not already downloaded)
const downloadScript = spawn('python', ['download_models.py'], {
  cwd: __dirname,
  stdio: 'inherit'
})

downloadScript.on('close', (code) => {
  if (code !== 0) {
    console.warn(`⚠️  Model download exited with code ${code}`)
  } else {
    console.log('✅ Models ready')
  }
  
  // Then start Flask
  const flaskProcess = spawn('python', ['app.py'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: {
      ...process.env,
      FLASK_ENV: process.env.NODE_ENV === 'production' ? 'production' : 'development'
    }
  })

  flaskProcess.on('error', (err) => {
    console.error('❌ Failed to start Flask:', err)
  })

  flaskProcess.on('close', (code) => {
    console.warn(`⚠️  Flask exited with code ${code}`)
  })
})

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
    timeout: 5000
  }

  const proxyReq = http.request(options, (proxyRes) => {
    let data = ''
    proxyRes.on('data', (chunk) => data += chunk)
    proxyRes.on('end', () => {
      try {
        res.json(JSON.parse(data))
      } catch {
        res.status(500).json({ error: 'Python backend not responding correctly' })
      }
    })
  })

  proxyReq.on('error', () => {
    res.status(503).json({ 
      error: 'Python backend unavailable',
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
      'Content-Type': req.headers['content-type']
    }
  }

  const proxyReq = http.request(options, (proxyRes) => {
    let data = ''
    proxyRes.on('data', (chunk) => data += chunk)
    proxyRes.on('end', () => {
      try {
        res.status(proxyRes.statusCode).json(JSON.parse(data))
      } catch {
        res.status(500).json({ error: 'Invalid response from Python backend' })
      }
    })
  })

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err)
    res.status(503).json({ error: 'Prediction service unavailable' })
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
