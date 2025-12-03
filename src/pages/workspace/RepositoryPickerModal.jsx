function RepositoryPickerModal({
  isOpen,
  workspace,
  integration,
  repositories,
  loading,
  error,
  selectedIds,
  onToggleRepo,
  onClose,
  onApply,
}) {
  if (!isOpen || !workspace || !integration) {
    return null
  }

  return (
    <div className="workspace-modal" role="dialog" aria-modal="true">
      <div className="workspace-modal__content repository-picker">
        <p className="workspace-modal__eyebrow">
          Available repositories for {integration.name}
        </p>
        <h3>{workspace.name}</h3>
        {loading ? (
          <p className="integration-status">Загрузка репозиториев…</p>
        ) : error ? (
          <p className="integration-status integration-status--error">{error}</p>
        ) : (
          <div className="repository-table">
            <div className="repository-table__header">
              <span>Repository</span>
              <span>Provider</span>
              <span>Default branch</span>
              <span>Link</span>
            </div>
            {repositories.map((repo) => (
              <label key={repo.external_id} className="repository-table__row">
                <input
                  type="checkbox"
                  checked={selectedIds.has(repo.external_id)}
                  onChange={() => onToggleRepo(repo.external_id)}
                />
                <span className="repository-table__name">{repo.full_path}</span>
                <span>{repo.provider}</span>
                <span>{repo.default_branch}</span>
                <a href={repo.web_url} target="_blank" rel="noreferrer">
                  link
                </a>
              </label>
            ))}
          </div>
        )}
        <div className="workspace-modal__actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="workspace-modal__confirm" onClick={onApply}>
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

export default RepositoryPickerModal
