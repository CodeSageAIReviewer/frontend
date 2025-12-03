import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import AuthPage from './pages/AuthPage'
import LandingPage from './pages/LandingPage'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Routes>
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="*" element={<Navigate to="/landing" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
