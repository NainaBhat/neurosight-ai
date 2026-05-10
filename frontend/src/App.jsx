import { useState } from 'react'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import HowItWorksSection from './components/HowItWorksSection'
import DetectionSection from './components/DetectionSection'
import AboutSection from './components/AboutSection'
import FAQSection from './components/FAQSection'
import Footer from './components/Footer'
import LoginPage from './components/LoginPage'
import SignupPage from './components/SignupPage'

export default function App() {
  const [page, setPage] = useState('home') // 'home' | 'login' | 'signup'

  const navigate = (p) => {
    setPage(p)
    window.scrollTo(0, 0)
  }

  if (page === 'login') return <LoginPage navigate={navigate} />
  if (page === 'signup') return <SignupPage navigate={navigate} />

  return (
    <div className="app">
      <Navbar navigate={navigate} />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <DetectionSection />
        <AboutSection />
        <FAQSection />
      </main>
      <Footer navigate={navigate} />
    </div>
  )
}
