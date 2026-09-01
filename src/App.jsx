// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedStaffRoute from './components/ProtectedStaffRoute'

import Home from './pages/Home'
import ProgramsPage from './pages/ProgramsPage'
import TrainingsPage from './pages/TrainingsPage'
import GalleryPage from './pages/GalleryPage'
import ContactPage from './pages/ContactPage'
import ReviewsPage from './pages/ReviewsPage'
import StaffLogin from './pages/staff/StaffLogin'
import StaffDashboard from './pages/staff/StaffDashboard'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="bg-glow-a" />
        <div className="bg-glow-b" />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/programs" element={<ProgramsPage />} />
          <Route path="/trainings" element={<TrainingsPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/staff" element={<StaffLogin />} />
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedStaffRoute>
                <StaffDashboard />
              </ProtectedStaffRoute>
            }
          />
        </Routes>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  )
}
