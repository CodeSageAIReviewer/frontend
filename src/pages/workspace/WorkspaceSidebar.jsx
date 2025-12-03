import IntegrationSection from './IntegrationSection'

function WorkspaceSidebar({
  workspaces,
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
  openRepos,
  toggleRepos,
  isRepoOpen,
  handleIntegrationSelect,
  handleRepoSelect,
  onWorkspaceSelect,
  onCreateWorkspaceClick,
  integrationFormError,
}) {
  const isIntegrationOpen = (workspaceId) => openIntegrations[workspaceId] ?? false

  return (
    <aside className="workspace-sidebar">
      <div className="workspace-sidebar__header">
        <div>
          <h2 className="workspace-sidebar__title">Workspaces</h2>
        </div>
        <button
          type="button"
          className="workspace-sidebar__create"
          onClick={onCreateWorkspaceClick}
        >
          <span className="workspace-sidebar__create-icon" aria-hidden="true">
            +
          </span>
          <span>Workspace</span>
        </button>
      </div>

      <ul className="workspace-tree">
        {workspaces.map((workspace) => {
        const isWorkspaceActive = activeNode.workspaceId === workspace.id
          return (
            <li key={workspace.id} className="workspace-tree__item">
              <button
                type="button"
                className={`workspace-tree__button ${isWorkspaceActive ? 'is-active' : ''}`}
                onClick={() => onWorkspaceSelect(workspace)}
              >
                <span className="workspace-tree__indicator" aria-hidden="true" />
                <span className="workspace-tree__label">{workspace.name}</span>
                <span className="workspace-tree__meta">{workspace.role || 'Member'}</span>
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
                onIntegrationSelect={(integration) =>
                  handleIntegrationSelect(workspace, integration)
                }
                onRepoSelect={(integration, repo) => handleRepoSelect(workspace, integration, repo)}
              />
            </li>
          )
        })}
      </ul>
    </aside>
  )
}

export default WorkspaceSidebar
