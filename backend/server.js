require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const { spawn } = require('child_process')
const path = require('path')
const http = require('http')
const fs = require('fs')
 
const app = express()
app.use(cors())
app.use(express.json())
 
// ──────────────────────────────────────────────────────────────────────────────
// FLASK STARTUP MANAGEMENT
// ──────────────────────────────────────────────────────────────────────────────
 
console.log('🧠 NeuroSight AI Backend Initialization')
console.log('=' .repeat(60))
 
// Track Flask readiness state
let flaskReady = false
const FLASK_START_TIMEOUT = 60000 // 60 seconds
const FLASK_PORT = process.env.FLASK_PORT || 5000
const NODE_PORT = process.env.PORT || 3000
 
// Ensure models directory exists (absolute path)
const modelsDir = path.resolve(__dirname, 'models')
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true })
  console.log(`📁 Created models directory: ${modelsDir}`)
}
 
// Set environment variables for Python subprocess
const pythonEnv = {
  ...process.env,
  FLASK_ENV: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  MODELS_DIR: modelsDir,  // CRITICAL: Absolute path
  FLASK_PORT: FLASK_PORT,  // CRITICAL: Pass port explicitly
  PYTHONUNBUFFERED: '1',  // Unbuffered output for real-time logging
}
 
console.log(`📊 Environment:`)
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`)
console.log(`   MODELS_DIR: ${modelsDir}`)
console.log(`   FLASK_PORT: ${FLASK_PORT}`)
console.log(`   NODE_PORT: ${NODE_PORT}`)
 
// ─── Download Models ───────────────────────────────────────────────────────
 
function downloadModels() {
  return new Promise((resolve) => {
    console.log('📥 Starting model download...')
    
    const downloadScript = spawn('python', ['download_models.py'], {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: pythonEnv,
      timeout: 300000  // 5 minute timeout for downloads
    })
 
    let downloadOutput = ''
    let downloadErrors = ''
 
    downloadScript.stdout.on('data', (data) => {
      const msg = data.toString()
      downloadOutput += msg
      console.log(`[download_models] ${msg.trim()}`)
    })
 
    downloadScript.stderr.on('data', (data) => {
      const msg = data.toString()
      downloadErrors += msg
      console.warn(`[download_models] ⚠️  ${msg.trim()}`)
    })
 
    downloadScript.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Models downloaded successfully')
      } else {
        console.warn(`⚠️  Model download exited with code ${code}`)
      }
 
      // Verify models exist
      const vggPath = path.join(modelsDir, 'brain_tumor_detection_vgg16.keras')
      const effnetPath = path.join(modelsDir, 'brain_tumor_detection_efficientnetb0')
 
      console.log(`📊 Model files verification:`)
      console.log(`   VGG16: ${vggPath}`)
      console.log(`          [${fs.existsSync(vggPath) ? '✅ EXISTS' : '❌ MISSING'}]`)
      console.log(`   EfficientNet: ${effnetPath}`)
      console.log(`                 [${fs.existsSync(effnetPath) ? '✅ EXISTS' : '❌ MISSING'}]`)
 
      resolve()
    })
 
    downloadScript.on('error', (err) => {
      console.error('❌ Failed to spawn download script:', err.message)
      resolve()  // Continue anyway
    })
  })
}
 
// ─── Start Flask Server ───────────────────────────────────────────────────────
 
function startFlask() {
  return new Promise((resolve) => {
    console.log('🚀 Starting Python Flask server...')
 
    const flaskProcess = spawn('python', ['app.py'], {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: pythonEnv,
      timeout: 120000  // 2 minute timeout
    })
 
    let flaskOutput = ''
    let flaskErrors = ''
    let startupTimer = null
 
    flaskProcess.stdout.on('data', (data) => {
      const output = data.toString()
      flaskOutput += output
      console.log(`[Flask] ${output.trim()}`)
 
      // Flask reports when it's ready
      if (output.includes('Running on') || output.includes('WARNING in app.run')) {
        if (!flaskReady) {
          flaskReady = true
          console.log('✅ Flask is ready to receive requests')
          if (startupTimer) clearTimeout(startupTimer)
        }
      }
    })
 
    flaskProcess.stderr.on('data', (data) => {
      const output = data.toString()
      flaskErrors += output
      console.error(`[Flask] ${output.trim()}`)
    })
 
    flaskProcess.on('error', (err) => {
      console.error('❌ Failed to start Flask:', err.message)
    })
 
    flaskProcess.on('close', (code) => {
      console.warn(`⚠️  Flask exited with code ${code}`)
      if (code !== 0) {
        console.warn('Last Flask output:', flaskOutput.substring(-500))
        console.warn('Last Flask errors:', flaskErrors.substring(-500))
      }
    })
 
    // Startup timeout check
    startupTimer = setTimeout(() => {
      if (!flaskReady) {
        console.warn('⚠️  Flask did not report ready within 60 seconds')
        console.warn('   (may still be initializing TensorFlow...)')
      }
      resolve()
    }, FLASK_START_TIMEOUT)
 
    // Resolve immediately if Flask starts quickly
    const checkReadyTimer = setInterval(() => {
      if (flaskReady) {
        clearInterval(checkReadyTimer)
        if (startupTimer) clearTimeout(startupTimer)
        resolve()
      }
    }, 1000)
  })
}
 
// ─── Initialize on Startup ───────────────────────────────────────────────────
 
async function initializeBackend() {
  try {
    await downloadModels()
    await startFlask()
    console.log('=' .repeat(60))
    console.log('✅ Backend initialization complete')
    console.log('=' .repeat(60))
  } catch (err) {
    console.error('❌ Initialization error:', err)
  }
}
 
// Start initialization immediately
initializeBackend()
 
// ──────────────────────────────────────────────────────────────────────────────
// MONGODB CONNECTION
// ──────────────────────────────────────────────────────────────────────────────
 
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err.message))
 
// ──────────────────────────────────────────────────────────────────────────────
// USER AUTHENTICATION SCHEMA & ROUTES
// ──────────────────────────────────────────────────────────────────────────────
 
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
}, { timestamps: true })
 
const User = mongoose.model('User', userSchema)
 
// POST /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body
 
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required.' })
    }
 
    // Check if user exists
    const existing = await User.findOne({ $or: [{ email }, { username }] })
    if (existing) {
      return res.status(400).json({ message: 'Username or email already in use.' })
    }
 
    // Hash password
    const hashed = await bcrypt.hash(password, 10)
 
    // Create user
    const user = await User.create({ username, email, password: hashed })
 
    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
 
    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: { id: user._id, username: user.username, email: user.email }
    })
  } catch (err) {
    console.error('Signup error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
})
 
// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
 
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }
 
    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }
 
    // Check password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }
 
    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
 
    res.json({
      message: 'Login successful!',
      token,
      user: { id: user._id, username: user.username, email: user.email }
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
})
 
// ──────────────────────────────────────────────────────────────────────────────
// FLASK PROXY ROUTES
// ──────────────────────────────────────────────────────────────────────────────
 
// GET /api/health - Check Python backend status
app.get('/api/health', (req, res) => {
  const options = {
    hostname: 'localhost',
    port: FLASK_PORT,
    path: '/health',
    method: 'GET',
    timeout: 5000
  }
 
  const proxyReq = http.request(options, (proxyRes) => {
    let data = ''
    proxyRes.on('data', (chunk) => data += chunk)
    proxyRes.on('end', () => {
      try {
        const jsonData = JSON.parse(data)
        res.json(jsonData)
      } catch {
        res.status(500).json({
          error: 'Python backend not responding correctly',
          flaskReady: flaskReady
        })
      }
    })
  })
 
  proxyReq.on('error', () => {
    res.status(503).json({
      error: 'Python backend unavailable',
      flaskReady: flaskReady,
      models: { vgg16: false, efficientnetb0: false }
    })
  })
 
  proxyReq.end()
})
 
// POST /api/predict - Forward MRI prediction to Flask
app.post('/api/predict', (req, res) => {
  // Check if Flask is ready
  if (!flaskReady) {
    return res.status(503).json({
      error: 'Flask backend is initializing. Please try again in a few seconds.',
      type: 'ServiceUnavailable',
      hint: 'Try again in 30-60 seconds when model loading completes'
    })
  }
 
  const options = {
    hostname: 'localhost',
    port: FLASK_PORT,
    path: '/predict',
    method: 'POST',
    headers: {
      'Content-Type': req.headers['content-type'] || 'application/octet-stream',
      'Connection': 'keep-alive'
    },
    timeout: 35000  // 35 second timeout (Flask gets 30s)
  }
 
  let proxyReq
 
  try {
    proxyReq = http.request(options, (proxyRes) => {
      let data = ''
      let isChunked = false
 
      proxyRes.on('data', (chunk) => {
        data += chunk
        if (data.length > 10 * 1024 * 1024) {
          // Safety: limit response to 10MB
          proxyReq.destroy()
          res.status(413).json({ error: 'Response too large' })
        }
      })
 
      proxyRes.on('end', () => {
        try {
          // Try to parse response as JSON
          const jsonData = JSON.parse(data)
 
          // Forward Flask's status code and data
          res.status(proxyRes.statusCode).json(jsonData)
        } catch (parseErr) {
          // Flask returned non-JSON (likely HTML error page)
          console.error('❌ Flask response was not valid JSON')
          console.error('   Status:', proxyRes.statusCode)
          console.error('   First 200 chars:', data.substring(0, 200))
 
          res.status(503).json({
            error: 'Flask backend returned invalid response',
            type: 'InvalidResponse',
            statusCode: proxyRes.statusCode,
            hint: 'Check Render logs for Flask errors'
          })
        }
      })
    })
 
    // Handle timeout
    proxyReq.on('timeout', () => {
      proxyReq.destroy()
      console.warn('⚠️  Flask request timeout (35s)')
      res.status(504).json({
        error: 'Flask backend request timed out after 35 seconds',
        type: 'GatewayTimeout',
        hint: 'Model inference may be slow on free tier. Try again.'
      })
    })
 
    // Handle connection errors
    proxyReq.on('error', (err) => {
      console.error('❌ Flask proxy error:', err.message)
      res.status(503).json({
        error: 'Flask backend is unavailable',
        type: 'ServiceUnavailable',
        details: err.message
      })
    })
 
    // Forward the request body (file upload)
    req.pipe(proxyReq)
  } catch (err) {
    console.error('❌ Error creating proxy request:', err)
    res.status(500).json({
      error: 'Internal server error',
      type: 'InternalError'
    })
  }
})
 
// ──────────────────────────────────────────────────────────────────────────────
// START EXPRESS SERVER
// ──────────────────────────────────────────────────────────────────────────────
 
app.listen(NODE_PORT, () => {
  console.log(``)
  console.log(`🚀 Express server running on http://localhost:${NODE_PORT}`)
  console.log(``)
  console.log(`📡 Available API Routes:`)
  console.log(`   POST   /api/auth/signup`)
  console.log(`   POST   /api/auth/login`)
  console.log(`   GET    /api/health (checks Python backend)`)
  console.log(`   POST   /api/predict (MRI tumor detection)`)
  console.log(``)
  console.log(`🔗 Frontend should connect to: https://neurosight-ai.vercel.app`)
  console.log(``)
})
 
// Handle process termination
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...')
  process.exit(0)
})
 
process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...')
  process.exit(0)
})
 
