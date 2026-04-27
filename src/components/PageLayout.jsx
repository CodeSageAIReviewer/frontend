import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
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

const LLM_PROVIDER_DEFAULT_BASE_URL = {
  openai: 'https://api.openai.com/v1',
  deepseek: 'https://api.deepseek.com',
  ollama: 'http://localhost:11434/v1',
}

const LLM_FIELD_HINTS = {
  model: {
    title: 'Модель',
    text:
      'Это имя модели, которую будет использовать интеграция. Примеры: gpt-4o, deepseek-chat, llama3. Для локального Ollama укажите тег модели из `ollama list`.',
  },
  base_url: {
    title: 'Base URL',
    text:
      'Base URL — адрес API провайдера. Для OpenAI обычно https://api.openai.com/v1, для DeepSeek — https://api.deepseek.com, для Ollama — http://localhost:11434/v1.',
  },
  api_key: {
    title: 'API ключ',
    text:
      'Ключ авторизации для провайдера LLM. Обычно создаётся в личном кабинете OpenAI/DeepSeek. Для Ollama API ключ, как правило, не требуется.',
  },
}

const INITIAL_LLM_FORM = {
  name: '',
  provider: 'openai',
  model: '',
  base_url: LLM_PROVIDER_DEFAULT_BASE_URL.openai,
  api_key: '',
}

function FieldLabelWithHint({
  label,
  hintKey,
  activeHintKey,
  onToggleHint,
}) {
  return (
    <span className="llm-field-label">
      <span>{label}</span>
      <button
        type="button"
        className="llm-tooltip"
        aria-label={`Показать подсказку: ${label}`}
        aria-haspopup="dialog"
        aria-expanded={activeHintKey === hintKey}
        onClick={() => onToggleHint(hintKey)}
      >
        ?
      </button>
    </span>
  )
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
  const [activeHelpHint, setActiveHelpHint] = useState('')

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
    setActiveHelpHint('')
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
    setActiveHelpHint('')
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
        if (activeHelpHint) {
          setActiveHelpHint('')
          return
        }
        handleCloseProviders()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeHelpHint, fetchIntegrations, handleCloseProviders, isProvidersOpen])

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
      if (field !== 'provider') {
        return { ...prev, [field]: value }
      }

      const previousProvider = prev.provider
      const previousDefault = LLM_PROVIDER_DEFAULT_BASE_URL[previousProvider] ?? ''
      const nextDefault = LLM_PROVIDER_DEFAULT_BASE_URL[value] ?? ''
      const normalizedBaseUrl = prev.base_url.trim()
      const shouldApplyDefault = !normalizedBaseUrl || normalizedBaseUrl === previousDefault

      return {
        ...prev,
        provider: value,
        base_url: shouldApplyDefault ? nextDefault : prev.base_url,
        api_key: value === 'ollama' ? '' : prev.api_key,
      }
    })
  }, [])

  const handleStartCreate = useCallback(() => {
    resetLlmForm()
  }, [resetLlmForm])

  const handleStartEdit = useCallback((integration) => {
    if (!integration) {
      return
    }
    setActiveHelpHint('')
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
  const activeFormTitle = editingIntegration ? 'Редактирование интеграции' : 'Новая интеграция'
  const activeFormActionLabel = editingIntegration ? 'Сохранить изменения' : 'Создать интеграцию'

  const isRouteActive = useCallback(
    (pathname) => location.pathname.startsWith(pathname),
    [location.pathname],
  )

  return (
    <div className="page-layout">
      {showNavbar && (
        <header className="site-navbar">
          <div className="site-navbar__inner">
            <div className="site-brand">
              <Link to="/landing">CodeSage</Link>
              <span className="site-brand__meta">AI Code Review</span>
            </div>

            <nav className="site-navbar__routes" aria-label="Основная навигация">
              <Link
                to="/landing"
                className={`ui-btn ui-btn--ghost ui-btn--sm ${
                  isRouteActive('/landing') ? 'site-navbar__route is-active' : 'site-navbar__route'
                }`}
              >
                Главная
              </Link>
              <Link
                to="/docs"
                className={`ui-btn ui-btn--ghost ui-btn--sm ${
                  isRouteActive('/docs') ? 'site-navbar__route is-active' : 'site-navbar__route'
                }`}
              >
                Документация
              </Link>
              {isAuthenticated && (
                <Link
                  to="/workspace"
                  className={`ui-btn ui-btn--ghost ui-btn--sm ${
                    isRouteActive('/workspace')
                      ? 'site-navbar__route is-active'
                      : 'site-navbar__route'
                  }`}
                >
                  Рабочее пространство
                </Link>
              )}
            </nav>

            <div className="site-navbar__actions">
              {isAuthenticated && (
                <button
                  type="button"
                  className="ui-btn ui-btn--secondary ui-btn--sm"
                  onClick={handleOpenProviders}
                >
                  LLM провайдеры
                </button>
              )}
              <button
                type="button"
                className="ui-btn ui-btn--secondary ui-btn--sm"
                onClick={handleAuthAction}
              >
                {authLabel}
              </button>
            </div>
          </div>
        </header>
      )}
      {isProvidersOpen && (
        <div className="modal-overlay" onClick={handleCloseProviders}>
          <div
            className="modal-window llm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="llm-providers-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="llm-modal__header">
              <div className="llm-modal__title-block">
                <p className="llm-modal__eyebrow">LLM интеграции</p>
                <h2 id="llm-providers-title">Управление провайдерами</h2>
                <p className="llm-modal__subtitle">
                  Выберите интеграцию для редактирования или создайте новую.
                </p>
              </div>
              <button
                type="button"
                className="ui-btn ui-btn--ghost ui-btn--sm"
                onClick={handleCloseProviders}
              >
                Закрыть
              </button>
            </header>
            <div className="llm-modal__layout">
              <section className="llm-section ui-panel">
                <div className="llm-section__header llm-section__header--with-action">
                  <h3 className="llm-section__title">
                    Интеграции
                    <span className="llm-section__count">{llmIntegrations.length}</span>
                  </h3>
                  <button
                    type="button"
                    className="ui-btn ui-btn--secondary ui-btn--sm"
                    onClick={handleStartCreate}
                  >
                    Новая интеграция
                  </button>
                </div>
                {llmLoading ? (
                  <p className="llm-empty ui-status ui-status--info">Загружаю интеграции…</p>
                ) : llmError ? (
                  <p className="llm-error ui-status ui-status--danger">{llmError}</p>
                ) : llmIntegrations.length === 0 ? (
                  <div className="llm-empty-state">
                    <p className="llm-empty ui-status">Пока нет провайдеров. Добавьте первую интеграцию.</p>
                    <button
                      type="button"
                      className="ui-btn ui-btn--secondary ui-btn--sm"
                      onClick={handleStartCreate}
                    >
                      Добавить провайдера
                    </button>
                  </div>
                ) : (
                  <ul className="llm-list">
                    {llmIntegrations.map((integration) => (
                      <li
                        key={integration.id}
                        className={`llm-item ui-panel ${
                          editingIntegration?.id === integration.id ? 'is-active' : ''
                        }`}
                      >
                        <div className="llm-item__top">
                          <div>
                            <p className="llm-item__title">{integration.name}</p>
                            <p className="llm-item__meta">
                              {providerLabelMap[integration.provider] ??
                                integration.provider}
                            </p>
                          </div>
                          <span className="llm-item__badge ui-badge ui-badge--info">
                            {integration.model}
                          </span>
                        </div>
                        <p className="llm-item__meta">
                          Base URL: {integration.base_url || '—'}
                        </p>
                        <p className="llm-item__meta">
                          API ключ: {integration.api_key_present ? 'установлен' : 'отсутствует'}
                        </p>
                        <div className="llm-item__actions">
                          <button
                            type="button"
                            className="llm-item__button ui-btn ui-btn--ghost ui-btn--sm"
                            onClick={() => handleStartEdit(integration)}
                          >
                            Изменить
                          </button>
                          <button
                            type="button"
                            className="llm-item__button llm-item__button--danger ui-btn ui-btn--danger ui-btn--sm"
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
                  <div className="llm-delete ui-status ui-status--warning">
                    <p className="llm-delete__text">
                      Удалить интеграцию «{deleteTarget.name}»?
                    </p>
                    {deleteError && <p className="llm-error ui-status ui-status--danger">{deleteError}</p>}
                    <div className="llm-delete__actions">
                      <button
                        type="button"
                        className="llm-item__button ui-btn ui-btn--ghost ui-btn--sm"
                        onClick={handleCloseDelete}
                        disabled={isDeleting}
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        className="llm-item__button llm-item__button--danger ui-btn ui-btn--danger ui-btn--sm"
                        onClick={handleConfirmDelete}
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Удаляю…' : 'Удалить'}
                      </button>
                    </div>
                  </div>
                )}
              </section>
              <section className="llm-section llm-section--form ui-panel">
                <div className="llm-section__header">
                  <h3 className="llm-section__title">{activeFormTitle}</h3>
                </div>
                <form className="llm-form" onSubmit={handleSubmitLlm}>
                  <label className="llm-field ui-field">
                    <span>Название</span>
                    <input
                      className="ui-input"
                      type="text"
                      value={llmForm.name}
                      maxLength={255}
                      onChange={(event) => handleFormChange('name', event.target.value)}
                      placeholder="Мой LLM"
                      required
                    />
                  </label>
                  <label className="llm-field ui-field">
                    <span>Провайдер</span>
                    <select
                      className="ui-select"
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
                  <label className="llm-field ui-field">
                    <FieldLabelWithHint
                      label="Модель"
                      hintKey="model"
                      activeHintKey={activeHelpHint}
                      onToggleHint={(hintKey) =>
                        setActiveHelpHint((prev) => (prev === hintKey ? '' : hintKey))
                      }
                    />
                    <input
                      className="ui-input"
                      type="text"
                      value={llmForm.model}
                      maxLength={255}
                      onChange={(event) => handleFormChange('model', event.target.value)}
                      placeholder="gpt-4o / deepseek-chat / llama3"
                      required
                    />
                  </label>
                  <label className="llm-field ui-field">
                    <FieldLabelWithHint
                      label="Base URL"
                      hintKey="base_url"
                      activeHintKey={activeHelpHint}
                      onToggleHint={(hintKey) =>
                        setActiveHelpHint((prev) => (prev === hintKey ? '' : hintKey))
                      }
                    />
                    <input
                      className="ui-input"
                      type="url"
                      value={llmForm.base_url}
                      onChange={(event) => handleFormChange('base_url', event.target.value)}
                      placeholder={
                        LLM_PROVIDER_DEFAULT_BASE_URL[llmForm.provider] ??
                        'https://api.example.com/v1'
                      }
                    />
                  </label>
                  <label className="llm-field ui-field">
                    <FieldLabelWithHint
                      label={editingIntegration ? 'Новый API ключ' : 'API ключ'}
                      hintKey="api_key"
                      activeHintKey={activeHelpHint}
                      onToggleHint={(hintKey) =>
                        setActiveHelpHint((prev) => (prev === hintKey ? '' : hintKey))
                      }
                    />
                    <input
                      className="ui-input"
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
                  {llmFormError && <p className="llm-error ui-status ui-status--danger">{llmFormError}</p>}
                  <div className="llm-form__actions">
                    {editingIntegration && (
                      <button
                        type="button"
                        className="llm-item__button ui-btn ui-btn--ghost"
                        onClick={handleStartCreate}
                        disabled={isSavingLlm}
                      >
                        Отменить редактирование
                      </button>
                    )}
                    <button
                      type="submit"
                      className="llm-submit ui-btn ui-btn--primary"
                      disabled={isSavingLlm}
                    >
                      {isSavingLlm
                        ? 'Сохраняю…'
                        : activeFormActionLabel}
                    </button>
                  </div>
                </form>
                {activeHelpHint && LLM_FIELD_HINTS[activeHelpHint] && (
                  <div
                    className="llm-help-dialog-overlay"
                    onClick={() => setActiveHelpHint('')}
                  >
                    <div
                      className="llm-help-dialog"
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="llm-help-title"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="llm-help-dialog__header">
                        <p id="llm-help-title" className="llm-help-dialog__title">
                          {LLM_FIELD_HINTS[activeHelpHint].title}
                        </p>
                        <button
                          type="button"
                          className="llm-help-dialog__close"
                          onClick={() => setActiveHelpHint('')}
                          aria-label="Закрыть подсказку"
                        >
                          ×
                        </button>
                      </div>
                      <p className="llm-help-dialog__text">
                        {LLM_FIELD_HINTS[activeHelpHint].text}
                      </p>
                    </div>
                  </div>
                )}
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
