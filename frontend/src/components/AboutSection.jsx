import { useState } from 'react'

function StatBar({ label, value, max, color }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="stat-bar">
      <div className="stat-bar__header">
        <span className="stat-bar__label">{label}</span>
        <span className="stat-bar__count">{value.toLocaleString()}</span>
      </div>
      <div className="stat-bar__track">
        <div className="stat-bar__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function AboutSection() {
  const [videoError, setVideoError] = useState(false)

  const tumorStats = [
    { label: 'Glioma', value: 310000, color: '#ef4444' },
    { label: 'Meningioma', value: 230000, color: '#f97316' },
    { label: 'Pituitary Tumor', value: 180000, color: '#8b5cf6' },
    { label: 'Other Brain Tumors', value: 95000, color: '#06b6d4' },
  ]

  const doctors = [
    { name: 'Dr. B. K. Misra', role: 'NEUROSURGEON', hospital: 'P. D. Hinduja Hospital, Mumbai', specialty: 'Complex brain tumor surgeries' },
    { name: 'Dr. Ashok K. Mahapatra', role: 'NEUROSURGEON', hospital: 'AIIMS, New Delhi', specialty: 'Pioneering neuro-oncology' },
    { name: 'Dr. Aditya Gupta', role: 'NEUROSURGEON', hospital: 'Artemis Hospitals, Gurugram ', specialty: 'Microsurgery for brain and spine tumors' },
  ]

  return (
    <section id="about" className="section section--about">
      <div className="container">
        <div className="section-header">
          <p className="section-overline">Medical Knowledge</p>
          <h2 className="section-title">Understanding Brain Tumors</h2>
          <p className="section-subtitle">
            A brain tumor is a mass or growth of abnormal cells in the brain. There are many different types,
            ranging from non-cancerous (benign) to cancerous (malignant). Early detection is crucial.
          </p>
        </div>

        {/* Video Section */}
        <div className="video-section">
          <div className="video-wrapper">
            {!videoError ? (
              <video
                controls
                className="about-video"
                onError={() => setVideoError(true)}
                poster=""
              >
                {/* 
                  ⬇️  REPLACE THIS SRC with your actual local/hosted video path.
                  Example: <source src="/videos/brain-tumor-explainer.mp4" type="video/mp4" />
                  For Vercel deployment, place the video in frontend/public/videos/
                */}
                <source src="/videos/brain-tumor-explainer.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="video-placeholder">
                <div className="video-placeholder__icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/>
                  </svg>
                </div>
                <p>
                  <strong>Video Placeholder</strong><br/>
                  Place your video file at <code>frontend/public/videos/brain-tumor-explainer.mp4</code>
                  <br/>and it will automatically appear here.
                </p>
              </div>
            )}
          </div>
          <div className="video-caption">
            Educational overview of brain tumor types, symptoms, and modern treatment approaches.
          </div>
        </div>

        {/* Statistical Data */}
        <div className="stats-section">
          <div className="section-header">
            <p className="section-overline">Data-Driven Insights</p>
            <h2 className="section-title" style={{ fontSize: '1.8rem' }}>Statistical Data</h2>
            <p className="section-subtitle">
              Approximately 300,000+ new cases of brain tumors are diagnosed globally each year.
              The following data highlights the distribution of tumor types and global incidence.
            </p>
          </div>

          <div className="stats-layout">
            <div className="stats-bars">
              <h3>Annual Incidence by Tumor Type</h3>
              <p className="stats-note">Estimated new cases per year (Global)</p>
              {tumorStats.map(s => (
                <StatBar key={s.label} {...s} max={400000} />
              ))}
            </div>

            <div className="stats-cards">
              <div className="stat-highlight">
                <span className="stat-highlight__num">~330K</span>
                <span className="stat-highlight__label">New cases globally per year</span>
              </div>
              <div className="stat-highlight">
                <span className="stat-highlight__num">70%</span>
                <span className="stat-highlight__label">Cases are benign or low-grade</span>
              </div>
              <div className="stat-highlight">
                <span className="stat-highlight__num">5-yr</span>
                <span className="stat-highlight__label">Survival improves 40% with early detection</span>
              </div>
              <div className="stat-highlight">
                <span className="stat-highlight__num">MRI</span>
                <span className="stat-highlight__label">Gold standard for tumor imaging</span>
              </div>
            </div>
          </div>
        </div>

        {/* About the Model */}
        <div className="model-section">
          <div className="model-text">
            <p className="section-overline">Our Technology</p>
            <h3>About the AI Model</h3>
            <p>
              NeuroSight AI uses an <strong>ensemble of two state-of-the-art CNN architectures</strong> trained
              on thousands of labeled MRI scans:
            </p>
            <ul className="model-list">
              <li>
                <strong>VGG16</strong> — A deep 16-layer CNN pretrained on ImageNet, fine-tuned for MRI classification.
                Achieved ~94.64% test accuracy independently.
              </li>
              <li>
                <strong>EfficientNetB0</strong> — A highly efficient CNN using compound scaling, fine-tuned with
                two-phase training (feature extraction + top-layer unfreezing). Achieved ~93.04% test accuracy.
              </li>
              <li>
                <strong>Ensemble</strong> — Softmax outputs from both models are averaged, producing a final
                ensemble accuracy of <strong>~95.4%</strong> on the held-out test set.
              </li>
            </ul>
            <p>
              The model classifies MRIs into: <strong>Glioma</strong>, <strong>Meningioma</strong>,
              <strong> Pituitary Tumor</strong>, and <strong>No Tumor</strong>.
              Input images are resized to 224×224px and pixel-normalized before inference.
            </p>
          </div>
          <div className="model-chart">
            <div className="accuracy-chart">
              <h4>Model Accuracy Comparison</h4>
              {[
                { name: 'Ensemble (VGG16 + EfficientNetB0)', acc: 95.4, color: '#2196f3' },
                { name: 'VGG16 alone', acc: 94.6, color: '#1565c0' },
                { name: 'EfficientNetB0 alone', acc: 93.04, color: '#42a5f5' },
              ].map(m => (
                <div key={m.name} className="acc-bar">
                  <div className="acc-bar__header">
                    <span>{m.name}</span>
                    <span style={{ color: m.color }}>{m.acc}%</span>
                  </div>
                  <div className="acc-bar__track">
                    <div className="acc-bar__fill" style={{ width: `${m.acc}%`, background: m.color }} />
                  </div>
                </div>
              ))}
              <p className="chart-note">*Evaluated on held-out test set (1600 images)</p>
            </div>
          </div>
        </div>

        {/* Top Doctors */}
        <div className="doctors-section">
          <div className="section-header">
            <p className="section-overline">Leading Experts</p>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.5rem 0' }}>
              Top Doctors &amp; Researchers
            </h3>
          </div>
          <div className="doctors-grid">
            {doctors.map((d, i) => (
              <div key={i} className="doctor-card">
                <div className="doctor-avatar">
                  {d.name.split(' ').slice(-1)[0][0]}
                </div>
                <div>
                  <h4 className="doctor-name">{d.name}</h4>
                  <p className="doctor-role">{d.role}</p>
                  <p className="doctor-spec">{d.specialty}</p>
                  <p className="doctor-hospital">{d.hospital}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
