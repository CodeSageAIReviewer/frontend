import { FaGithub } from 'react-icons/fa'
import { FaGitlab } from 'react-icons/fa6'

const providerIcons = {
  github: FaGithub,
  gitlab: FaGitlab,
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
  if (!isActive) {
    return null
  }

  const showList = isIntegrationOpen

  const renderRepoNodes = (integration) => {
    const repoList = savedRepositories[integration.id] ?? []
    const repoOpen = isRepoOpen(integration.id)
    const Icon = providerIcons[integration.provider] || null

    return (
      <div key={integration.id} className="integration-item">
        <button
          type="button"
          className={`tree-item tree-item--integration ${
            activeNode.type === 'integration' && activeNode.id === integration.id
              ? 'tree-item--active'
              : ''
          }`}
          onClick={() => onIntegrationSelect(integration)}
        >
          <span
            className={`chevron ${repoOpen ? 'chevron--open' : ''}`}
            aria-hidden="true"
            onClick={(event) => {
              event.stopPropagation()
              toggleRepos(integration.id)
            }}
          />
          {Icon ? (
            <Icon className="integration-provider-icon" aria-hidden="true" />
          ) : (
            <span className="node-icon node-icon--integration" aria-hidden="true" />
          )}
          <span>{integration.name}</span>
        </button>

        <button
          type="button"
          className="integration-repo-launch"
          onClick={() => onOpenRepositoryModal(workspace, integration)}
        >
          + Repository
        </button>

        {repoOpen && (
          <div className="repo-list">
            {savedRepositoriesLoading && workspace.id === selectedWorkspaceId ? (
              <p className="integration-status">Загружаем репозитории…</p>
            ) : savedRepositoriesError && workspace.id === selectedWorkspaceId ? (
              <p className="integration-status integration-status--error">{savedRepositoriesError}</p>
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
          <span
            className={`chevron ${isIntegrationOpen ? 'chevron--open' : ''}`}
            aria-hidden="true"
          />
          <span>Integrations</span>
        </button>
        <button
          type="button"
          className="pill-button pill-button--outline"
          onClick={handleToggleIntegrationForm}
        >
          {isAddingIntegration ? 'Cancel' : '+ Integration'}
        </button>
      </div>

      {isAddingIntegration && selectedWorkspaceId === workspace.id && (
        <form className="integration-form" onSubmit={handleCreateIntegration}>
          <div className="integration-form__fields">
            <label>
              <span>Name</span>
              <input
                type="text"
                value={integrationForm.name}
                onChange={(event) =>
                  handleIntegrationFormChange('name', event.target.value)
                }
                placeholder="Название интеграции"
                required
              />
            </label>
            <label>
              <span>Provider</span>
              <select
                value={integrationForm.provider}
                onChange={(event) =>
                  handleIntegrationFormChange('provider', event.target.value)
                }
              >
                <option value="github">GitHub</option>
                <option value="gitlab">GitLab</option>
              </select>
            </label>
            <label>
              <span>Base URL</span>
              <input
                type="url"
                value={integrationForm.base_url}
                onChange={(event) =>
                  handleIntegrationFormChange('base_url', event.target.value)
                }
                placeholder="https://git.example.com"
              />
            </label>
            <label>
              <span>Access token</span>
              <input
                type="password"
                value={integrationForm.access_token}
                onChange={(event) =>
                  handleIntegrationFormChange('access_token', event.target.value)
                }
                required
              />
            </label>
            <label>
              <span>Refresh token</span>
              <input
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
            <button type="submit" disabled={isSubmittingIntegration}>
              {isSubmittingIntegration ? 'Creating…' : 'Connect integration'}
            </button>
          </div>
        </form>
      )}

      {showList && (
        <div className="integration-list">
          {integrationsLoading && workspace.id === selectedWorkspaceId ? (
            <p className="integration-status">Загружаем интеграции…</p>
          ) : integrationsError && workspace.id === selectedWorkspaceId ? (
            <p className="integration-status integration-status--error">{integrationsError}</p>
          ) : integrations.length === 0 ? (
            <div className="integration-empty">
              <p>No integrations</p>
              <p className="integration-empty__hint">
                Добавь интеграцию выше, чтобы начать
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
