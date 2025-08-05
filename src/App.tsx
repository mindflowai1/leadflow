import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import FaviconImage from './components/FaviconImage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import GeradorLeads from './pages/GeradorLeads'
import ListaDetalhes from './pages/ListaDetalhes'
import DisparadorMassa from './pages/DisparadorMassa'

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <FaviconImage />
        <Navbar />
        
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/gerador" element={<GeradorLeads />} />
            <Route path="/disparador" element={<DisparadorMassa />} />
            <Route path="/lista/:id" element={<ListaDetalhes />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  )
}

export default App