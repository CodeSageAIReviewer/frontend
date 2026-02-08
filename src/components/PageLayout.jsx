import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  createLlmIntegration,
  deleteLlmIntegration,
  listLlmIntegrations,
  updateLlmIntegration,
} from '../services/llmClient'
import './PageLayout.css'

const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI ChatGPT' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'ollama', label: 'Ollama (Local)' },
]

const INITIAL_LLM_FORM = {
  name: '',
  provider: 'openai',
  model: '',
  base_url: '',
  api_key: '',
}

function PageLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, logout } = useAuth()
  const [isProvidersOpen, setIsProvidersOpen] = useState(false)
  const [llmIntegrations, setLlmIntegrations] = useState([])
  const [llmLoading, setLlmLoading] = useState(false)
  const [llmError, setLlmError] = useState('')
  const [llmForm, setLlmForm] = useState(INITIAL_LLM_FORM)
  const [llmFormError, setLlmFormError] = useState('')
  const [isSavingLlm, setIsSavingLlm] = useState(false)
  const [editingIntegration, setEditingIntegration] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleAuthAction = () => {
    if (isAuthenticated) {
      logout()
      navigate('/landing')
      return
    }
    navigate('/auth')
  }

  const resetLlmForm = useCallback(() => {
    setLlmForm(INITIAL_LLM_FORM)
    setLlmFormError('')
    setEditingIntegration(null)
  }, [])

  const handleOpenProviders = useCallback(() => {
    setIsProvidersOpen(true)
    setLlmError('')
    setDeleteError('')
    setDeleteTarget(null)
    resetLlmForm()
  }, [resetLlmForm])

  const handleCloseProviders = useCallback(() => {
    setIsProvidersOpen(false)
    setLlmError('')
    setDeleteError('')
    setDeleteTarget(null)
    resetLlmForm()
  }, [resetLlmForm])

  const fetchIntegrations = useCallback(async () => {
    setLlmLoading(true)
    setLlmError('')
    try {
      const data = await listLlmIntegrations()
      setLlmIntegrations(Array.isArray(data) ? data : [])
    } catch (error) {
      setLlmError(error.message ?? 'Не удалось загрузить интеграции.')
    } finally {
      setLlmLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isProvidersOpen) {
      return
    }

    fetchIntegrations()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsProvidersOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [fetchIntegrations, isProvidersOpen])

  const providerLabelMap = useMemo(() => {
    const map = {}
    PROVIDER_OPTIONS.forEach((option) => {
      map[option.value] = option.label
    })
    return map
  }, [])

  const isApiKeyRequired =
    llmForm.provider === 'openai' || llmForm.provider === 'deepseek'

  const handleFormChange = useCallback((field, value) => {
    setLlmForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'provider' && value === 'ollama') {
        next.api_key = ''
      }
      return next
    })
  }, [])

  const handleStartCreate = useCallback(() => {
    resetLlmForm()
  }, [resetLlmForm])

  const handleStartEdit = useCallback((integration) => {
    if (!integration) {
      return
    }
    setEditingIntegration(integration)
    setLlmForm({
      name: integration.name ?? '',
      provider: integration.provider ?? 'openai',
      model: integration.model ?? '',
      base_url: integration.base_url ?? '',
      api_key: '',
    })
    setLlmFormError('')
  }, [])

  const handleSubmitLlm = useCallback(
    async (event) => {
      event.preventDefault()
      setLlmFormError('')

      const trimmedName = llmForm.name.trim()
      const trimmedModel = llmForm.model.trim()
      const trimmedBaseUrl = llmForm.base_url.trim()
      const trimmedApiKey = llmForm.api_key.trim()

      if (!trimmedName) {
        setLlmFormError('Введите название интеграции.')
        return
      }

      if (!trimmedModel) {
        setLlmFormError('Укажите модель.')
        return
      }

      if (!editingIntegration && isApiKeyRequired && !trimmedApiKey) {
        setLlmFormError('Для этого провайдера нужен API ключ.')
        return
      }

      setIsSavingLlm(true)
      try {
        if (editingIntegration) {
          const payload = {
            name: trimmedName,
            model: trimmedModel,
            base_url: trimmedBaseUrl,
          }
          if (trimmedApiKey) {
            payload.api_key = trimmedApiKey
          }
          await updateLlmIntegration(editingIntegration.id, payload)
        } else {
          const payload = {
            name: trimmedName,
            provider: llmForm.provider,
            model: trimmedModel,
            base_url: trimmedBaseUrl || null,
            api_key: isApiKeyRequired ? trimmedApiKey : null,
          }
          await createLlmIntegration(payload)
        }
        await fetchIntegrations()
        resetLlmForm()
      } catch (error) {
        setLlmFormError(error.message ?? 'Не удалось сохранить интеграцию.')
      } finally {
        setIsSavingLlm(false)
      }
    },
    [
      editingIntegration,
      fetchIntegrations,
      isApiKeyRequired,
      llmForm,
      resetLlmForm,
    ],
  )

  const handleOpenDelete = useCallback((integration) => {
    setDeleteTarget(integration)
    setDeleteError('')
  }, [])

  const handleCloseDelete = useCallback(() => {
    setDeleteTarget(null)
    setDeleteError('')
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) {
      return
    }
    setIsDeleting(true)
    setDeleteError('')
    try {
      await deleteLlmIntegration(deleteTarget.id)
      if (editingIntegration && editingIntegration.id === deleteTarget.id) {
        resetLlmForm()
      }
      setDeleteTarget(null)
      await fetchIntegrations()
    } catch (error) {
      setDeleteError(error.message ?? 'Не удалось удалить интеграцию.')
    } finally {
      setIsDeleting(false)
    }
  }, [deleteTarget, editingIntegration, fetchIntegrations, resetLlmForm])

  const authLabel = isAuthenticated ? 'Выйти' : 'Войти'
  const showNavbar = location.pathname !== '/auth'
  const contentClass = 'page-content'

  return (
    <div className="page-layout">
      {showNavbar && (
        <nav className="site-navbar">
          <div className="site-brand">
            <Link to="/landing">CodeSage</Link>
          </div>
          <div className="site-navbar__actions">
            <Link to="/docs" className="nav-button nav-button--ghost">
              Docs
            </Link>
            {isAuthenticated && (
              <button
                type="button"
                className="nav-button nav-button--ghost"
                onClick={handleOpenProviders}
              >
                LLM
              </button>
            )}
            {isAuthenticated && (
              <Link to="/workspace" className="nav-link-button">
                Workspace
              </Link>
            )}
            <button type="button" className="nav-button" onClick={handleAuthAction}>
              {authLabel}
            </button>
          </div>
        </nav>
      )}
      {isProvidersOpen && (
        <div className="modal-overlay" onClick={handleCloseProviders}>
          <div
            className="modal-window"
            role="dialog"
            aria-modal="true"
            aria-labelledby="llm-providers-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-header">
              <div>
                <p className="modal-eyebrow">LLM интеграции</p>
                <h2 id="llm-providers-title">Ваши провайдеры</h2>
              </div>
              <button type="button" className="modal-close" onClick={handleCloseProviders}>
                Закрыть
              </button>
            </header>
            <div className="modal-body modal-body--split">
              <section className="llm-section">
                <div className="llm-section__header">
                  <h3 className="llm-section__title">Список интеграций</h3>
                </div>
                {llmLoading ? (
                  <p className="llm-empty">Загружаю интеграции…</p>
                ) : llmError ? (
                  <p className="llm-error">{llmError}</p>
                ) : llmIntegrations.length === 0 ? (
                  <p className="llm-empty">
                    Пока нет провайдеров. Создайте первую интеграцию.
                  </p>
                ) : (
                  <ul className="llm-list">
                    {llmIntegrations.map((integration) => (
                      <li key={integration.id} className="llm-item">
                        <div className="llm-item__top">
                          <div>
                            <p className="llm-item__title">{integration.name}</p>
                            <p className="llm-item__meta">
                              {providerLabelMap[integration.provider] ??
                                integration.provider}
                            </p>
                          </div>
                          <span className="llm-item__badge">{integration.model}</span>
                        </div>
                        <p className="llm-item__meta">
                          Base URL: {integration.base_url || '—'}
                        </p>
                        <p className="llm-item__meta">
                          API ключ: {integration.api_key_present ? 'установлен' : 'нет'}
                        </p>
                        <div className="llm-item__actions">
                          <button
                            type="button"
                            className="llm-item__button"
                            onClick={() => handleStartEdit(integration)}
                          >
                            Изменить
                          </button>
                          <button
                            type="button"
                            className="llm-item__button llm-item__button--danger"
                            onClick={() => handleOpenDelete(integration)}
                          >
                            Удалить
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {deleteTarget && (
                  <div className="llm-delete">
                    <p className="llm-delete__text">
                      Удалить интеграцию «{deleteTarget.name}»?
                    </p>
                    {deleteError && <p className="llm-error">{deleteError}</p>}
                    <div className="llm-delete__actions">
                      <button
                        type="button"
                        className="llm-item__button"
                        onClick={handleCloseDelete}
                        disabled={isDeleting}
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        className="llm-item__button llm-item__button--danger"
                        onClick={handleConfirmDelete}
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Удаляю…' : 'Удалить'}
                      </button>
                    </div>
                  </div>
                )}
              </section>
              <section className="llm-section llm-section--form">
                <div className="llm-section__header">
                  <h3 className="llm-section__title">
                    {editingIntegration ? 'Редактирование' : 'Новая интеграция'}
                  </h3>
                </div>
                <form className="llm-form" onSubmit={handleSubmitLlm}>
                  <label className="llm-field">
                    <span>Название</span>
                    <input
                      type="text"
                      value={llmForm.name}
                      maxLength={255}
                      onChange={(event) => handleFormChange('name', event.target.value)}
                      placeholder="Мой LLM"
                      required
                    />
                  </label>
                  <label className="llm-field">
                    <span>Провайдер</span>
                    <select
                      value={llmForm.provider}
                      onChange={(event) => handleFormChange('provider', event.target.value)}
                      disabled={Boolean(editingIntegration)}
                    >
                      {PROVIDER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="llm-field">
                    <span>Модель</span>
                    <input
                      type="text"
                      value={llmForm.model}
                      maxLength={255}
                      onChange={(event) => handleFormChange('model', event.target.value)}
                      placeholder="gpt-4o / deepseek-chat / llama3"
                      required
                    />
                  </label>
                  <label className="llm-field">
                    <span>Base URL</span>
                    <input
                      type="url"
                      value={llmForm.base_url}
                      onChange={(event) => handleFormChange('base_url', event.target.value)}
                      placeholder="http://localhost:11434"
                    />
                  </label>
                  <label className="llm-field">
                    <span>
                      {editingIntegration
                        ? 'Новый API ключ'
                        : 'API ключ'}
                    </span>
                    <input
                      type="password"
                      value={llmForm.api_key}
                      onChange={(event) => handleFormChange('api_key', event.target.value)}
                      placeholder={
                        isApiKeyRequired
                          ? 'Введите ключ'
                          : 'Не требуется для Ollama'
                      }
                      disabled={!isApiKeyRequired}
                    />
                  </label>
                  {editingIntegration && isApiKeyRequired && (
                    <p className="llm-hint">Оставьте поле пустым, чтобы не менять ключ.</p>
                  )}
                  {!editingIntegration && !isApiKeyRequired && (
                    <p className="llm-hint">API ключ не требуется для Ollama.</p>
                  )}
                  {llmFormError && <p className="llm-error">{llmFormError}</p>}
                  <div className="llm-form__actions">
                    {editingIntegration && (
                      <button
                        type="button"
                        className="llm-item__button"
                        onClick={handleStartCreate}
                        disabled={isSavingLlm}
                      >
                        Отменить редактирование
                      </button>
                    )}
                    <button
                      type="submit"
                      className="llm-submit"
                      disabled={isSavingLlm}
                    >
                      {isSavingLlm
                        ? 'Сохраняю…'
                        : editingIntegration
                          ? 'Сохранить изменения'
                          : 'Создать интеграцию'}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </div>
        </div>
      )}
      <div className={contentClass}>{children}</div>
    </div>
  )
}

export default PageLayout
