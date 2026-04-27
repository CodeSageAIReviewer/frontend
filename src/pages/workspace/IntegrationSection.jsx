import { useEffect, useMemo, useState } from 'react'
import { FaGithub } from 'react-icons/fa'
import { FaGitlab } from 'react-icons/fa6'

const providerIcons = {
  github: FaGithub,
  gitlab: FaGitlab,
}

const integrationFieldHints = {
  base_url: {
    title: 'Базовый URL',
    text:
      'Base URL — адрес API вашего Git-провайдера. Для GitHub Cloud обычно подходит https://api.github.com, для GitLab Cloud — https://gitlab.com/api/v4. Для self-hosted укажите URL вашего инстанса API.',
  },
  access_token: {
    title: 'Токен доступа',
    text:
      'Токен доступа нужен, чтобы читать репозитории, ветки и merge requests. Создаётся в настройках Personal Access Token GitHub/GitLab с правами чтения репозиториев и MR/PR.',
  },
  refresh_token: {
    title: 'Токен обновления',
    text:
      'Токен обновления нужен не всегда. Заполняйте его, только если ваш провайдер интеграции выдает refresh token для продления access token.',
  },
}

function FieldLabelWithHint({
  label,
  hintKey,
  isActive,
  onToggleHint,
}) {
  return (
    <span className="integration-field-label">
      <span>{label}</span>
      <button
        type="button"
        className="integration-tooltip"
        aria-label={`Показать подсказку: ${label}`}
        aria-haspopup="dialog"
        aria-expanded={isActive}
        onClick={() => onToggleHint(hintKey)}
      >
        ?
      </button>
    </span>
  )
}

function IntegrationSection({
  workspace,
  isActive,
  integrations,
  selectedWorkspaceId,
  activeNode,
  isIntegrationOpen,
  toggleIntegrations,
  toggleRepos,
  isRepoOpen,
  integrationsLoading,
  integrationsError,
  isAddingIntegration,
  handleToggleIntegrationForm,
  integrationForm,
  handleIntegrationFormChange,
  handleCreateIntegration,
  isSubmittingIntegration,
  integrationFormError,
  savedRepositories,
  savedRepositoriesLoading,
  savedRepositoriesError,
  onIntegrationSelect,
  onRepoSelect,
  onOpenRepositoryModal,
}) {
  const [activeHint, setActiveHint] = useState('')
  const activeHintContent = useMemo(
    () =>
      isAddingIntegration && activeHint
        ? integrationFieldHints[activeHint]
        : null,
    [activeHint, isAddingIntegration],
  )

  useEffect(() => {
    if (!activeHint) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActiveHint('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeHint])

  if (!isActive) {
    return null
  }

  const showList = isIntegrationOpen

  const renderRepoNodes = (integration) => {
    const repoList = savedRepositories[integration.id] ?? []
    const repoOpen = isRepoOpen(integration.id)
    const Icon = providerIcons[integration.provider] || null
    const isIntegrationActive =
      activeNode.type === 'integration' && activeNode.id === integration.id

    return (
      <div key={integration.id} className="integration-item">
        <div className={`integration-item__head ${isIntegrationActive ? 'is-active' : ''}`}>
          <button
            type="button"
            className={`tree-item tree-item--integration ${
              isIntegrationActive ? 'tree-item--active' : ''
            }`}
            onClick={() => onIntegrationSelect(integration)}
          >
            {Icon ? (
              <Icon className="integration-provider-icon" aria-hidden="true" />
            ) : (
              <span className="node-icon node-icon--integration" aria-hidden="true" />
            )}
            <span className="integration-item__name">{integration.name}</span>
          </button>
          <button
            type="button"
            className="integration-item__toggle"
            onClick={() => toggleRepos(integration.id)}
            aria-expanded={repoOpen}
            aria-label={repoOpen ? 'Свернуть репозитории' : 'Развернуть репозитории'}
          >
            <span className={`chevron ${repoOpen ? 'chevron--open' : ''}`} aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          className="integration-repo-launch ui-btn ui-btn--ghost ui-btn--sm"
          onClick={() => onOpenRepositoryModal(workspace, integration)}
        >
          + Репозиторий
        </button>

        {repoOpen && (
          <div className="repo-list">
            {savedRepositoriesLoading && workspace.id === selectedWorkspaceId ? (
              <p className="integration-status ui-status ui-status--info">Загружаем репозитории…</p>
            ) : savedRepositoriesError && workspace.id === selectedWorkspaceId ? (
              <p className="integration-status integration-status--error ui-status ui-status--danger">{savedRepositoriesError}</p>
            ) : repoList.length === 0 ? (
              <p className="repo-empty">Нет подключённых репозиториев</p>
            ) : (
              repoList.map((repo) => {
                const repoId = `${integration.id}-${repo.external_id}`
                const isRepoActive =
                  activeNode.type === 'repository' && activeNode.id === repoId
                return (
                  <div
                    key={repoId}
                    className={`repo-entry ${isRepoActive ? 'repo-entry--active' : ''}`}
                  >
                    <button
                      type="button"
                      className={`tree-item tree-item--repo ${
                        isRepoActive ? 'tree-item--active' : ''
                      }`}
                      onClick={() => onRepoSelect(integration, repo)}
                    >
                      <div className="repo-row">
                        <span className="repo-row__name">{repo.full_path}</span>
                        <span className="repo-row__meta">
                          {repo.provider} • {repo.default_branch || 'main'}
                        </span>
                      </div>
                    </button>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="workspace-tree__group">
      <div className="integration-header">
        <button
          type="button"
          className="integration-toggle"
          onClick={toggleIntegrations}
        >
          <span className={`chevron ${isIntegrationOpen ? 'chevron--open' : ''}`} aria-hidden="true" />
          <span>Интеграции</span>
        </button>
        <button
          type="button"
          className="pill-button ui-btn ui-btn--ghost ui-btn--sm"
          onClick={handleToggleIntegrationForm}
        >
          {isAddingIntegration ? 'Отмена' : '+ Интеграция'}
        </button>
      </div>

      {isAddingIntegration && selectedWorkspaceId === workspace.id && (
        <form className="integration-form" onSubmit={handleCreateIntegration}>
          <div className="integration-form__fields">
            <label className="ui-field">
              <span>Название</span>
              <input
                className="ui-input"
                type="text"
                value={integrationForm.name}
                onChange={(event) =>
                  handleIntegrationFormChange('name', event.target.value)
                }
                placeholder="Название интеграции"
                required
              />
            </label>
            <label className="ui-field">
              <span>Провайдер</span>
              <select
                className="ui-select"
                value={integrationForm.provider}
                onChange={(event) =>
                  handleIntegrationFormChange('provider', event.target.value)
                }
              >
                <option value="github">GitHub</option>
                <option value="gitlab">GitLab</option>
              </select>
            </label>
            <label className="ui-field">
              <FieldLabelWithHint
                label="Базовый URL"
                hintKey="base_url"
                isActive={activeHint === 'base_url'}
                onToggleHint={(hintKey) =>
                  setActiveHint((prev) => (prev === hintKey ? '' : hintKey))
                }
              />
              <input
                className="ui-input"
                type="url"
                value={integrationForm.base_url}
                onChange={(event) =>
                  handleIntegrationFormChange('base_url', event.target.value)
                }
                placeholder="https://git.example.com"
              />
            </label>
            <label className="ui-field">
              <FieldLabelWithHint
                label="Токен доступа"
                hintKey="access_token"
                isActive={activeHint === 'access_token'}
                onToggleHint={(hintKey) =>
                  setActiveHint((prev) => (prev === hintKey ? '' : hintKey))
                }
              />
              <input
                className="ui-input"
                type="password"
                value={integrationForm.access_token}
                onChange={(event) =>
                  handleIntegrationFormChange('access_token', event.target.value)
                }
                required
              />
            </label>
            <label className="ui-field">
              <FieldLabelWithHint
                label="Токен обновления"
                hintKey="refresh_token"
                isActive={activeHint === 'refresh_token'}
                onToggleHint={(hintKey) =>
                  setActiveHint((prev) => (prev === hintKey ? '' : hintKey))
                }
              />
              <input
                className="ui-input"
                type="password"
                value={integrationForm.refresh_token}
                onChange={(event) =>
                  handleIntegrationFormChange('refresh_token', event.target.value)
                }
              />
            </label>
          </div>
          {integrationFormError && (
            <p className="integration-form__error">{integrationFormError}</p>
          )}
          <div className="integration-form__actions">
            <button type="submit" className="ui-btn ui-btn--primary" disabled={isSubmittingIntegration}>
              {isSubmittingIntegration ? 'Создаю…' : 'Подключить интеграцию'}
            </button>
          </div>
        </form>
      )}
      {activeHintContent && (
        <div
          className="integration-help-dialog-overlay"
          onClick={() => setActiveHint('')}
        >
          <div
            className="integration-help-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="integration-help-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="integration-help-dialog__header">
              <p id="integration-help-title" className="integration-help-dialog__title">
                {activeHintContent.title}
              </p>
              <button
                type="button"
                className="integration-help-dialog__close"
                onClick={() => setActiveHint('')}
                aria-label="Закрыть подсказку"
              >
                ×
              </button>
            </div>
            <p className="integration-help-dialog__text">{activeHintContent.text}</p>
          </div>
        </div>
      )}

      {showList && (
        <div className="integration-list">
          {integrationsLoading && workspace.id === selectedWorkspaceId ? (
            <p className="integration-status ui-status ui-status--info">Загружаем интеграции…</p>
          ) : integrationsError && workspace.id === selectedWorkspaceId ? (
            <p className="integration-status integration-status--error ui-status ui-status--danger">{integrationsError}</p>
          ) : integrations.length === 0 ? (
            <div className="integration-empty">
              <p>Нет интеграций</p>
              <p className="integration-empty__hint">
                Добавьте интеграцию выше, чтобы начать
              </p>
            </div>
          ) : (
            integrations.map(renderRepoNodes)
          )}
        </div>
      )}
    </div>
  )
}

export default IntegrationSection
