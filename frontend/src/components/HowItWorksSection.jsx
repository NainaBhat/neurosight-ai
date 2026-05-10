export default function HowItWorksSection() {
  const steps = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      ),
      step: '01',
      title: 'Upload MRI Scan',
      desc: 'Securely upload your brain MRI image in JPG or PNG format. Your data stays private and is never stored permanently.',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
        </svg>
      ),
      step: '02',
      title: 'AI Ensemble Analysis',
      desc: 'Our ensemble of VGG16 & EfficientNetB0 models independently analyzes your MRI. Predictions are averaged for maximum accuracy (~95.4%).',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
        </svg>
      ),
      step: '03',
      title: 'View Results & Suggestions',
      desc: 'Receive the predicted tumor type, confidence probabilities for all 4 classes, and AI-generated clinical guidance in seconds.',
    },
  ]

  return (
    <section id="how-it-works" className="section section--light">
      <div className="container">
        <div className="section-header">
          <p className="section-overline">Simple Process</p>
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Our platform simplifies the process of getting a preliminary analysis of brain MRI scans.
            It&apos;s a straightforward 3-step process designed for ease of use and quick results.
          </p>
        </div>

        <div className="steps-grid">
          {steps.map((s, i) => (
            <div className="step-card" key={i}>
              <div className="step-card__number">{s.step}</div>
              <div className="step-card__icon">{s.icon}</div>
              <h3 className="step-card__title">{s.title}</h3>
              <p className="step-card__desc">{s.desc}</p>
              {i < steps.length - 1 && <div className="step-card__arrow" />}
            </div>
          ))}
        </div>

        <p className="steps-note">
          For a detailed guide on our model and platform usage, check out our{' '}
          <a href="#about" onClick={(e) => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }) }}>
            documentation
          </a>
        </p>
      </div>
    </section>
  )
}
