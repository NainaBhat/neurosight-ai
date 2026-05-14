import { useState, useRef, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'https://neurosight-ai-gj77.onrender.com'

const CLASS_COLORS = {
  glioma:     '#ef4444',
  meningioma: '#f97316',
  notumor:    '#22c55e',
  pituitary:  '#8b5cf6',
}

const CLASS_DISPLAY = {
  glioma:     'Glioma',
  meningioma: 'Meningioma',
  notumor:    'No Tumor',
  pituitary:  'Pituitary Tumor',
}

function ProbabilityBar({ label, value, color }) {
  const pct = (value * 100).toFixed(1)
  return (
    <div className="prob-bar">
      <div className="prob-bar__label">
        <span>{CLASS_DISPLAY[label] || label}</span>
        <span className="prob-bar__value">{pct}%</span>
      </div>
      <div className="prob-bar__track">
        <div
          className="prob-bar__fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

function ResultCard({ result, onReset }) {
  const isPositive = result.prediction !== 'notumor'
  const color = CLASS_COLORS[result.prediction] || '#2196f3'

  return (
    <div className="result-card">
      <div className="result-card__header" style={{ borderColor: color }}>
        <div className="result-card__badge" style={{ background: color + '18', color }}>
          {isPositive ? '⚠️ Tumor Detected' : '✅ No Tumor Found'}
        </div>
        <h3 className="result-card__prediction">
          Prediction: <span style={{ color }}>{CLASS_DISPLAY[result.prediction]}</span>
        </h3>
        <p className="result-card__confidence">
          Confidence: <strong>{(result.confidence * 100).toFixed(1)}%</strong>
        </p>
      </div>

      <div className="result-card__body">
        <h4 className="result-card__sub">Probability Breakdown</h4>
        <div className="prob-bars">
          {Object.entries(result.probabilities)
            .sort((a, b) => b[1] - a[1])
            .map(([k, v]) => (
              <ProbabilityBar key={k} label={k} value={v} color={CLASS_COLORS[k] || '#2196f3'} />
            ))
          }
        </div>

        <div className={`result-suggestion ${isPositive ? 'result-suggestion--warn' : 'result-suggestion--ok'}`}>
          <div className="result-suggestion__icon">{isPositive ? '🏥' : '✅'}</div>
          <div>
            <h4>AI Suggestion</h4>
            <p>{result.suggestion}</p>
          </div>
        </div>

        <div className="result-disclaimer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>
            <strong>Research Prototype Only.</strong> This tool is NOT a substitute for professional medical diagnosis.
            Always consult a qualified neurologist or radiologist.
          </span>
        </div>
      </div>

      <button className="btn btn--outline result-card__reset" onClick={onReset}>
        Analyze Another Scan
      </button>
    </div>
  )
}

export default function DetectionSection() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const MAX_SIZE_MB = 10

  const handleFile = (f) => {
    if (!f) return
    if (!f.type.match(/image\/(jpeg|png|jpg|webp)/)) {
      setError('Please upload a JPG or PNG image file.')
      return
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${MAX_SIZE_MB}MB.`)
      return
    }
    setError(null)
    setResult(null)
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreview(url)
  }

  const onInputChange = (e) => handleFile(e.target.files[0])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [])

  const onDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  const analyze = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Prediction failed.')
      setResult(data)
    } catch (err) {
      setError(err.message || 'Could not connect to the analysis server. Please ensure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <section id="detection" className="section section--detection">
      <div className="container">
        <div className="section-header">
          <p className="section-overline">AI-Powered Analysis</p>
          <h2 className="section-title">Upload MRI Scan for Analysis</h2>
          <p className="section-subtitle">
            Upload a brain MRI image to get a classification from our deep learning ensemble model.
            Supported formats: JPG, PNG (max {MAX_SIZE_MB}MB).
          </p>
        </div>

        <div className="detection-layout">
          {/* Upload card */}
          <div className="upload-card">
            {!result ? (
              <>
                <div
                  className={`dropzone ${dragging ? 'dropzone--active' : ''} ${preview ? 'dropzone--has-preview' : ''}`}
                  onClick={() => inputRef.current?.click()}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                >
                  {preview ? (
                    <div className="dropzone__preview">
                      <img src={preview} alt="MRI preview" />
                      <div className="dropzone__preview-overlay">
                        <span>Click to change</span>
                      </div>
                    </div>
                  ) : (
                    <div className="dropzone__placeholder">
                      <div className="dropzone__icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2.5"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                      </div>
                      <p className="dropzone__main">Drag &amp; drop your MRI scan here</p>
                      <p className="dropzone__sub">or click to browse · JPG, PNG · max {MAX_SIZE_MB}MB</p>
                    </div>
                  )}
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={onInputChange}
                    style={{ display: 'none' }}
                  />
                </div>

                {file && (
                  <div className="file-info">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span>{file.name}</span>
                    <span className="file-info__size">({(file.size / 1024).toFixed(0)} KB)</span>
                  </div>
                )}

                {error && (
                  <div className="alert alert--error">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                  </div>
                )}

                <button
                  className={`btn btn--primary btn--full ${!file || loading ? 'btn--disabled' : ''}`}
                  onClick={analyze}
                  disabled={!file || loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner" />
                      Analyzing MRI with deep learning…
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><path d="M10 8l6 4-6 4V8z"/>
                      </svg>
                      Analyze MRI
                    </>
                  )}
                </button>
              </>
            ) : (
              <ResultCard result={result} onReset={reset} />
            )}
          </div>

          {/* Info panel */}
          <div className="detection-info">
            <div className="info-card">
              <h3>Detectable Conditions</h3>
              <ul className="tumor-types">
                {[
                  { key: 'glioma', label: 'Glioma', desc: 'Tumors arising from glial cells' },
                  { key: 'meningioma', label: 'Meningioma', desc: 'Tumors of the brain membranes' },
                  { key: 'pituitary', label: 'Pituitary Tumor', desc: 'Growth in the pituitary gland' },
                  { key: 'notumor', label: 'No Tumor', desc: 'No detectable abnormality' },
                ].map(t => (
                  <li key={t.key} className="tumor-type-item">
                    <span className="tumor-dot" style={{ background: CLASS_COLORS[t.key] }} />
                    <div>
                      <strong>{t.label}</strong>
                      <span>{t.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="info-card">
              <h3>Model Performance</h3>
              <div className="model-metrics">
                <div className="metric">
                  <span className="metric__value">95.4%</span>
                  <span className="metric__label">Overall Accuracy</span>
                </div>
                <div className="metric">
                  <span className="metric__value">VGG16</span>
                  <span className="metric__label">+ EfficientNetB0</span>
                </div>
                <div className="metric">
                  <span className="metric__value">224×224</span>
                  <span className="metric__label">Input Resolution</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
