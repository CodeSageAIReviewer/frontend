import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn, signUp } from '../services/authClient'
import { useAuth } from '../context/AuthContext'
import './AuthPage.css'

const initialForm = { username: '', password: '', password2: '' }

const modeConfig = {
  signin: {
    title: 'Вход',
    button: 'Войти',
    helper: 'Нет аккаунта? Начать регистрацию',
  },
  signup: {
    title: 'Регистрация',
    button: 'Создать аккаунт',
    helper: 'Уже зарегистрированы? Войти',
  },
}

function AuthPage() {
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const navigate = useNavigate()
  const { login } = useAuth()

  const toggleMode = () => {
    const nextMode = mode === 'signin' ? 'signup' : 'signin'
    setMode(nextMode)
    setForm(initialForm)
    setErrors(null)
    setSuccessMessage('')
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const currentMode = modeConfig[mode]

  const errorText = useMemo(() => {
    if (!errors) return ''
    if (typeof errors === 'string') return errors
    if (errors.password) return errors.password
    if (errors.detail) return errors.detail
    return 'Что-то пошло не так. Повторите попытку.'
  }, [errors])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrors(null)
    setSuccessMessage('')

    try {
      const { username, password, password2 } = form
      const payload =
        mode === 'signup'
          ? { username, password, password2 }
          : {
              username,
              password,
            }

      const handler = mode === 'signup' ? signUp : signIn
      const response = await handler(payload)
      const tokens = response?.data ?? response
      console.log('Auth response tokens:', tokens)
      if (tokens) {
        login(tokens)
      }
      setSuccessMessage('Запрос успешен. Токены будут сохранены в cookies.')
      navigate('/landing')
    } catch (error) {
      if (error.response?.data) {
        setErrors(error.response.data)
      } else {
        setErrors('Не удалось связаться с сервером.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>{currentMode.title}</h1>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Имя пользователя</span>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </label>
          <label>
            <span>Пароль</span>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </label>
          {mode === 'signup' && (
            <label>
              <span>Повторите пароль</span>
              <input
                name="password2"
                type="password"
                value={form.password2}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </label>
          )}
          {errorText && <p className="error-text">{errorText}</p>}
          {successMessage && <p className="success-text">{successMessage}</p>}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Сохраняем…' : currentMode.button}
          </button>
        </form>
        <p className="auth-toggle" onClick={toggleMode}>
          {currentMode.helper}
        </p>
      </div>
    </main>
  )
}

export default AuthPage
