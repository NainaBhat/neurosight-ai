require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

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

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`))
