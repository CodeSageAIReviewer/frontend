import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import AuthPage from './pages/AuthPage'
import LandingPage from './pages/LandingPage'
import WorkspacePage from './pages/WorkspacePage'
import { AuthProvider } from './context/AuthContext'
import PageLayout from './components/PageLayout'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-shell">
          <PageLayout>
            <Routes>
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/workspace" element={<WorkspacePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="*" element={<Navigate to="/landing" replace />} />
            </Routes>
          </PageLayout>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
