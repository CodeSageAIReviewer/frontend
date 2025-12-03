function WorkspaceContent({
  creatingWorkspace,
  newWorkspaceName,
  onNewWorkspaceNameChange,
  handleCreateWorkspace,
  formError,
  onCancelCreate,
  onStartCreate,
  selectedWorkspace,
  showActivePanel,
  activeInfo,
  canDeleteWorkspace,
  canEditWorkspace,
  onSettingsClick,
  onDeleteClick,
  isSubmitting,
  activeNode,
  activeIntegration,
  onIntegrationSettings,
  onIntegrationDelete,
}) {
  return (
    <section className="workspace-content">
      <div className="workspace-content__shell">
        {creatingWorkspace ? (
          <form className="workspace-form" onSubmit={handleCreateWorkspace}>
            <div className="workspace-form__title">
              <p className="workspace-form__eyebrow">Новый workspace</p>
              <h3>Придумайте понятное имя.</h3>
            </div>
            <label className="workspace-form__field">
              <span>Workspace name</span>
              <input
                type="text"
                value={newWorkspaceName}
                onChange={(event) => onNewWorkspaceNameChange(event.target.value)}
                placeholder="My design system..."
              />
            </label>
            {formError && <p className="workspace-form__error">{formError}</p>}
                <div className="workspace-form__actions">
                  <button type="button" onClick={onCancelCreate}>
                    Cancel
                  </button>
                  <button type="submit" className="primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving…' : 'Create workspace'}
                  </button>
                </div>
              </form>
            ) : showActivePanel ? (
          <div className="workspace-panel">
            <div className="workspace-panel__heading">
              <div>
                <p className="workspace-panel__eyebrow">{activeInfo.subtitle}</p>
                <h1>{activeInfo.title}</h1>
              </div>
            </div>
            <p className="workspace-panel__description">{activeInfo.body}</p>
            {selectedWorkspace && (
              <>
                <div className="workspace-panel__actions">
                  {activeNode?.type === 'workspace' && (
                    <button type="button">Добавить участника</button>
                  )}
                  {canEditWorkspace && activeNode?.type === 'workspace' && (
                    <button type="button" onClick={onSettingsClick}>
                      Настройки
                    </button>
                  )}
                  {canEditWorkspace &&
                    activeNode?.type === 'integration' &&
                    activeIntegration &&
                    onIntegrationSettings && (
                      <button
                        type="button"
                        onClick={() => onIntegrationSettings(activeIntegration)}
                      >
                        Настройки интеграции
                      </button>
                    )}
                  {canEditWorkspace &&
                    activeNode?.type === 'integration' &&
                    activeIntegration &&
                    onIntegrationDelete && (
                      <button
                        type="button"
                        className="workspace-panel__delete workspace-panel__delete--integration"
                        onClick={() => onIntegrationDelete(activeIntegration)}
                      >
                        Удалить интеграцию
                      </button>
                    )}
                  {canDeleteWorkspace &&
                    activeNode?.type === 'workspace' && (
                      <button
                        type="button"
                        className="workspace-panel__delete"
                        onClick={onDeleteClick}
                      >
                        Удалить
                      </button>
                    )}
                </div>
                <div className="workspace-panel__grid">
                  <article className="workspace-card">
                    <p className="workspace-card__label">Собственник</p>
                    <p className="workspace-card__value">ID {selectedWorkspace.owner_id}</p>
                  </article>
                  <article className="workspace-card">
                    <p className="workspace-card__label">Дата создания</p>
                    <p className="workspace-card__value">
                      {new Date(selectedWorkspace.created_at).toLocaleString('ru-RU')}
                    </p>
                  </article>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="workspace-empty">
            <div className="workspace-empty__illustration" aria-hidden="true">
              <svg viewBox="0 0 96 96">
                <rect x="12" y="28" width="72" height="52" rx="6" fill="#e2e8f0" />
                <rect x="26" y="18" width="44" height="8" rx="3" fill="#94a3b8" />
                <rect x="30" y="36" width="36" height="4" rx="2" fill="#ffffff" />
                <rect x="30" y="46" width="28" height="4" rx="2" fill="#ffffff" />
                <rect x="30" y="56" width="32" height="4" rx="2" fill="#ffffff" />
              </svg>
            </div>
            <h3>Workspace не выбран</h3>
            <p className="workspace-empty__description">
              Пора создать пространство и привести все задачи в одну панель.
            </p>
            <div className="workspace-empty__actions">
              <button type="button" onClick={onStartCreate}>
                + Создать workspace
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default WorkspaceContent
