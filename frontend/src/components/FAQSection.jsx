import { useState } from 'react'

const faqs = [
  {
    q: 'How accurate is the tumor detection model?',
    a: 'Our ensemble model achieves approximately 95.4% accuracy on the test set. VGG16 achieves ~94.6% and EfficientNetB0 achieves ~90.8% independently. The ensemble averages their softmax outputs for improved reliability.',
  },
  {
    q: 'What kind of MRI images can I upload?',
    a: 'You can upload brain MRI images in JPG or PNG format (up to 10MB). T1-weighted contrast MRI scans work best. The model accepts standard axial slice images similar to those used in clinical practice.',
  },
  {
    q: 'Can this platform be used to diagnose a brain tumor?',
    a: 'No. NeuroSight AI is a research prototype and educational tool only. It is NOT a medical device and CANNOT replace a clinical diagnosis by a licensed radiologist or neurologist. Always consult a qualified medical professional.',
  },
  {
    q: 'What should I do if the platform indicates a potential tumor?',
    a: 'Immediately consult a neurologist or neuro-oncologist. Share the result for context, but have a certified radiologist perform a full MRI review. A clinical diagnosis will require a contrast MRI, possibly a biopsy, and other tests.',
  },
  {
    q: 'Is my personal and medical data secure?',
    a: 'Your images are sent to our analysis server over HTTPS and are not stored permanently. We only log prediction metadata (prediction class, probabilities, timestamp) without any personally identifiable information. We do not store your MRI images.',
  },
  {
    q: 'Can I use this platform for research purposes?',
    a: 'Yes! This tool is built as a B.Tech final-year project on "Advanced MRI-based Brain Tumor Detection" You are welcome to reference, fork, or build upon it for academic and research purposes.',
  },
]

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState(null)

  return (
    <section id="faq" className="section section--light">
      <div className="container">
        <div className="section-header">
          <p className="section-overline">Common Questions</p>
          <h2 className="section-title">Frequently Asked Questions</h2>
        </div>
        <div className="faq-list">
          {faqs.map((f, i) => (
            <div key={i} className={`faq-item ${openIdx === i ? 'faq-item--open' : ''}`}>
              <button className="faq-question" onClick={() => setOpenIdx(openIdx === i ? null : i)}>
                <span>{f.q}</span>
                <svg className="faq-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {openIdx === i && (
                <div className="faq-answer">
                  <p>{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
