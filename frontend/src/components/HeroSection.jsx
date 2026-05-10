import { useEffect, useRef } from 'react'

export default function HeroSection() {
  const canvasRef = useRef(null)

  // Animated neural network / brain nodes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let W, H

    const resize = () => {
      W = canvas.width = canvas.offsetWidth
      H = canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Generate nodes in a rough brain silhouette
    const nodeCount = 80
    const nodes = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2.5 + 1,
      pulse: Math.random() * Math.PI * 2,
    }))

    const draw = (t) => {
      ctx.clearRect(0, 0, W, H)

      // Update positions
      nodes.forEach(n => {
        n.x += n.vx
        n.y += n.vy
        n.pulse += 0.02
        if (n.x < 0 || n.x > W) n.vx *= -1
        if (n.y < 0 || n.y > H) n.vy *= -1
      })

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.25
            ctx.beginPath()
            ctx.strokeStyle = `rgba(33, 150, 243, ${alpha})`
            ctx.lineWidth = 0.8
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }

      // Draw nodes
      nodes.forEach(n => {
        const glow = Math.sin(n.pulse) * 0.5 + 0.5
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r + glow, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(33, 150, 243, ${0.4 + glow * 0.5})`
        ctx.fill()
      })

      // Scan line effect
      const scanY = ((t * 0.0003) % 1) * H
      const scanGrad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40)
      scanGrad.addColorStop(0, 'rgba(33,150,243,0)')
      scanGrad.addColorStop(0.5, 'rgba(33,150,243,0.06)')
      scanGrad.addColorStop(1, 'rgba(33,150,243,0)')
      ctx.fillStyle = scanGrad
      ctx.fillRect(0, scanY - 40, W, 80)

      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  const scrollToDetection = () => {
    document.getElementById('detection')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="hero" className="hero">
      <canvas ref={canvasRef} className="hero__canvas" />
      <div className="hero__overlay" />

      <div className="hero__content">
        <div className="hero__badge">
          <span className="hero__badge-dot" />
          Advanced Brain Tumor Detection With AI
        </div>
        <h1 className="hero__title">
         Advanced MRI-Based <br />
          <span className="hero__title-accent">Brain Tumor Detection</span>
        </h1>
        <p className="hero__subtitle">
          Leveraging an ensemble of VGG16 &amp; EfficientNetB0 deep learning models to provide fast,
          accurate preliminary classification of brain MRI scans into glioma, meningioma, pituitary tumor, or no tumor.
        </p>
        <div className="hero__actions">
          <button className="btn btn--primary btn--lg" onClick={scrollToDetection}>
            Analyse My Scan
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
          <button className="btn btn--ghost btn--lg" onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}>
            Learn More
          </button>
        </div>

        <div className="hero__stats">
          <div className="hero__stat">
            <span className="hero__stat-num">95.4%</span>
            <span className="hero__stat-label">Test Accuracy</span>
          </div>
          <div className="hero__stat-divider" />
          <div className="hero__stat">
            <span className="hero__stat-num">4</span>
            <span className="hero__stat-label">Tumor Classes</span>
          </div>
          <div className="hero__stat-divider" />
          <div className="hero__stat">
            <span className="hero__stat-num">2</span>
            <span className="hero__stat-label">Ensemble Models</span>
          </div>
        </div>
      </div>
    </section>
  )
}
