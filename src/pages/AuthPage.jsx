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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isPassword2Visible, setIsPassword2Visible] = useState(false)
  const [isCapsLockOnPassword, setIsCapsLockOnPassword] = useState(false)
  const [isCapsLockOnPassword2, setIsCapsLockOnPassword2] = useState(false)

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
    setIsPasswordVisible(false)
    setIsPassword2Visible(false)
    setIsCapsLockOnPassword(false)
    setIsCapsLockOnPassword2(false)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const currentMode = modeConfig[mode]
  const isAnyCapsLockOn =
    isCapsLockOnPassword || (mode === 'signup' && isCapsLockOnPassword2)

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

  const handleCapsLockHint = (event, setState) => {
    setState(event.getModifierState('CapsLock'))
  }

  const EyeIcon = ({ crossed = false }) => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12c2.4-3.6 5.8-5.4 10-5.4S19.6 8.4 22 12c-2.4 3.6-5.8 5.4-10 5.4S4.4 15.6 2 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.1" stroke="currentColor" strokeWidth="1.7" />
      {crossed && (
        <path
          d="M4 20 20 4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}
    </svg>
  )

  return (
    <main className="auth-page">
      <section className="auth-layout">
        <article className="auth-intro ui-panel">
          <div className="auth-intro__header page-header page-header--compact">
            <p className="auth-intro__eyebrow page-header__eyebrow">CodeSage · Авторизация</p>
            <h1 className="page-header__title">AI Code Review Control Room</h1>
            <p className="auth-intro__text page-header__description">
              Единая точка входа для подключения интеграций и запуска проверок качества кода перед merge.
            </p>
          </div>
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
            <span className="auth-password">
              <input
                className="ui-input auth-password__input"
                name="password"
                type={isPasswordVisible ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                onKeyDown={(event) => handleCapsLockHint(event, setIsCapsLockOnPassword)}
                onKeyUp={(event) => handleCapsLockHint(event, setIsCapsLockOnPassword)}
                onBlur={() => setIsCapsLockOnPassword(false)}
                required
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="auth-password__toggle"
                onClick={() => setIsPasswordVisible((prev) => !prev)}
                aria-label={isPasswordVisible ? 'Скрыть пароль' : 'Показать пароль'}
                aria-pressed={isPasswordVisible}
              >
                <EyeIcon crossed={isPasswordVisible} />
              </button>
            </span>
          </label>
          {mode === 'signup' && (
            <label className="ui-field">
              <span>Повторите пароль</span>
              <span className="auth-password">
                <input
                  className="ui-input auth-password__input"
                  name="password2"
                  type={isPassword2Visible ? 'text' : 'password'}
                  value={form.password2}
                  onChange={handleChange}
                  onKeyDown={(event) => handleCapsLockHint(event, setIsCapsLockOnPassword2)}
                  onKeyUp={(event) => handleCapsLockHint(event, setIsCapsLockOnPassword2)}
                  onBlur={() => setIsCapsLockOnPassword2(false)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-password__toggle"
                  onClick={() => setIsPassword2Visible((prev) => !prev)}
                  aria-label={isPassword2Visible ? 'Скрыть пароль' : 'Показать пароль'}
                  aria-pressed={isPassword2Visible}
                >
                  <EyeIcon crossed={isPassword2Visible} />
                </button>
              </span>
            </label>
          )}
          {isAnyCapsLockOn && (
            <p className="ui-status ui-status--warning" role="status">
              Включён CapsLock. Проверьте регистр символов перед отправкой.
            </p>
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
