import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn, signUp } from '../services/authClient'
import { useAuth } from '../hooks/useAuth'
import './AuthPage.css'

const initialForm = { username: '', password: '', password2: '' }

const modeConfig = {
  signin: {
    title: 'Вход в систему',
    description: 'Откройте рабочее пространство и запустите ревью по вашим MR/PR.',
    button: 'Войти',
  },
  signup: {
    title: 'Создание аккаунта',
    description: 'Создайте учетную запись, чтобы настроить провайдеры и запустить первое ревью.',
    button: 'Создать аккаунт',
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

  const handleModeChange = (nextMode) => {
    if (nextMode === mode) {
      return
    }
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
      if (tokens) {
        login(tokens)
      }
      setSuccessMessage('Готово. Перенаправляю в рабочее пространство…')
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
      <section className="auth-layout">
        <article className="auth-intro ui-panel">
          <p className="auth-intro__eyebrow">CodeSage · Авторизация</p>
          <h1>AI Code Review Control Room</h1>
          <p className="auth-intro__text">
            Единая точка входа для подключения интеграций и запуска проверок качества кода перед merge.
          </p>
          <ul className="auth-intro__list">
            <li>Подключение LLM провайдеров и Git репозиториев</li>
            <li>Запуски ревью и история результатов</li>
            <li>Публикация замечаний в merge request</li>
          </ul>
        </article>

        <article className="auth-card ui-panel">
          <div className="auth-mode-switch" role="tablist" aria-label="Режим авторизации">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              className={`ui-btn ui-btn--sm ${
                mode === 'signin' ? 'ui-btn--primary auth-mode-switch__btn is-active' : 'ui-btn--ghost auth-mode-switch__btn'
              }`}
              onClick={() => handleModeChange('signin')}
            >
              Вход
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={`ui-btn ui-btn--sm ${
                mode === 'signup' ? 'ui-btn--primary auth-mode-switch__btn is-active' : 'ui-btn--ghost auth-mode-switch__btn'
              }`}
              onClick={() => handleModeChange('signup')}
            >
              Регистрация
            </button>
          </div>

          <header className="auth-card__head">
            <h2>{currentMode.title}</h2>
            <p>{currentMode.description}</p>
          </header>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="ui-field">
            <span>Имя пользователя</span>
            <input
              className="ui-input"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </label>
          <label className="ui-field">
            <span>Пароль</span>
            <input
              className="ui-input"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </label>
          {mode === 'signup' && (
            <label className="ui-field">
              <span>Повторите пароль</span>
              <input
                className="ui-input"
                name="password2"
                type="password"
                value={form.password2}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </label>
          )}
          {errorText && <p className="error-text ui-status ui-status--danger">{errorText}</p>}
          {successMessage && <p className="success-text ui-status ui-status--success">{successMessage}</p>}
          <button type="submit" className="ui-btn ui-btn--primary auth-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Сохраняем…' : currentMode.button}
          </button>
        </form>
        </article>
      </section>
    </main>
  )
}

export default AuthPage
