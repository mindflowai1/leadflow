import MagicHero from '../components/MagicHero'
import MagicSteps from '../components/MagicSteps'
import MagicBenefits from '../components/MagicBenefits'
import MagicTestimonials from '../components/MagicTestimonials'
import MagicCTA from '../components/MagicCTA'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <MagicHero />
      
      {/* Como Funciona */}
      <MagicSteps />
      
      {/* Benefícios */}
      <MagicBenefits />
      
      {/* Depoimentos */}
      <MagicTestimonials />
      
      {/* CTA Final */}
      <MagicCTA />
    </div>
  )
}