import IntegrationSection from './IntegrationSection'

function WorkspaceSidebar({
  workspaces,
  workspacesLoading,
  workspacesError,
  selectedWorkspaceId,
  activeNode,
  integrations,
  integrationsLoading,
  integrationsError,
  openIntegrations,
  toggleIntegrations,
  isAddingIntegration,
  handleToggleIntegrationForm,
  integrationForm,
  handleIntegrationFormChange,
  handleCreateIntegration,
  isSubmittingIntegration,
  toggleRepos,
  isRepoOpen,
  handleIntegrationSelect,
  handleRepoSelect,
  onWorkspaceSelect,
  onCreateWorkspaceClick,
  onRetryWorkspaces,
  integrationFormError,
  onOpenRepositoryModal,
  savedRepositories,
  savedRepositoriesLoading,
  savedRepositoriesError,
}) {
  const isIntegrationOpen = (workspaceId) => openIntegrations[workspaceId] ?? false

  return (
    <aside className="workspace-sidebar">
      <div className="workspace-sidebar__header">
        <div>
          <p className="workspace-sidebar__eyebrow">Навигация</p>
          <h2 className="workspace-sidebar__title">Рабочие пространства</h2>
          <p className="workspace-sidebar__caption">
            {workspacesLoading ? 'Загрузка…' : `Всего: ${workspaces.length}`}
          </p>
        </div>
        <button
          type="button"
          className="workspace-sidebar__create ui-btn ui-btn--secondary ui-btn--sm"
          onClick={onCreateWorkspaceClick}
        >
          <span className="workspace-sidebar__create-icon" aria-hidden="true">
            +
          </span>
          <span>Создать</span>
        </button>
      </div>

      <ul className="workspace-tree" aria-label="Список рабочих пространств">
        {workspacesLoading && (
          <li className="workspace-sidebar__status workspace-sidebar__status--loading ui-status ui-status--info">
            Загружаем рабочие пространства…
          </li>
        )}

        {!workspacesLoading && workspacesError && (
          <li className="workspace-sidebar__status workspace-sidebar__status--error">
            <p>{workspacesError}</p>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={onRetryWorkspaces}>
              Повторить
            </button>
          </li>
        )}

        {!workspacesLoading && !workspacesError && workspaces.length === 0 && (
          <li className="workspace-sidebar__status workspace-sidebar__status--empty">
            <p>Пока нет ни одного рабочего пространства.</p>
            <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={onCreateWorkspaceClick}>
              Создать пространство
            </button>
          </li>
        )}

        {!workspacesLoading && !workspacesError && workspaces.map((workspace) => {
          const isWorkspaceActive = activeNode.workspaceId === workspace.id
          return (
            <li key={workspace.id} className="workspace-tree__item">
              <button
                type="button"
                className={`workspace-tree__button ${isWorkspaceActive ? 'is-active' : ''}`}
                onClick={() => onWorkspaceSelect(workspace)}
                aria-current={isWorkspaceActive ? 'page' : undefined}
              >
                <span className="workspace-tree__indicator" aria-hidden="true" />
                <span className="workspace-tree__label">{workspace.name}</span>
                <span className="workspace-tree__meta">{workspace.role || 'Участник'}</span>
              </button>

              <IntegrationSection
                workspace={workspace}
                isActive={isWorkspaceActive}
                integrations={workspace.id === selectedWorkspaceId ? integrations : []}
                activeNode={activeNode}
                selectedWorkspaceId={selectedWorkspaceId}
                isIntegrationOpen={isIntegrationOpen(workspace.id)}
                toggleIntegrations={() => toggleIntegrations(workspace.id)}
                toggleRepos={toggleRepos}
                isRepoOpen={isRepoOpen}
                integrationsLoading={integrationsLoading}
                integrationsError={integrationsError}
                isAddingIntegration={isAddingIntegration}
                handleToggleIntegrationForm={handleToggleIntegrationForm}
                integrationForm={integrationForm}
                handleIntegrationFormChange={handleIntegrationFormChange}
                handleCreateIntegration={handleCreateIntegration}
                isSubmittingIntegration={isSubmittingIntegration}
                integrationFormError={integrationFormError}
                savedRepositories={savedRepositories}
                savedRepositoriesLoading={savedRepositoriesLoading}
                savedRepositoriesError={savedRepositoriesError}
                onIntegrationSelect={(integration) =>
                  handleIntegrationSelect(workspace, integration)
                }
                onRepoSelect={(integration, repo) => handleRepoSelect(workspace, integration, repo)}
                onOpenRepositoryModal={onOpenRepositoryModal}
              />
            </li>
          )
        })}
      </ul>
    </aside>
  )
}

export default WorkspaceSidebar
