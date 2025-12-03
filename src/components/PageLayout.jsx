import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './PageLayout.css'

function PageLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, logout } = useAuth()

  const handleAuthAction = () => {
    if (isAuthenticated) {
      logout()
      navigate('/landing')
      return
    }
    navigate('/auth')
  }

  const authLabel = isAuthenticated ? 'Выйти' : 'Войти'
  const showNavbar = location.pathname !== '/auth'
  const contentClass = showNavbar
    ? 'page-content page-content--with-navbar'
    : 'page-content page-content--standalone'

  return (
    <div className="page-layout">
      {showNavbar && (
        <nav className="site-navbar">
          <div className="site-brand">
            <Link to="/landing">CodeSage AI Reviewer</Link>
          </div>
          <button type="button" className="nav-button" onClick={handleAuthAction}>
            {authLabel}
          </button>
        </nav>
      )}
      <div className={contentClass}>{children}</div>
    </div>
  )
}

export default PageLayout
