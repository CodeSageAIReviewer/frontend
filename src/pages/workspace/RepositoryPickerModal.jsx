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
  applyLoading,
  applyError,
}) {
  if (!isOpen || !workspace || !integration) {
    return null
  }

  return (
    <div className="workspace-modal" role="dialog" aria-modal="true">
      <div className="workspace-modal__content repository-picker">
        <p className="workspace-modal__eyebrow">
          Доступные репозитории для {integration.name}
        </p>
        <h3>{workspace.name}</h3>
        {loading ? (
          <p className="workspace-modal__state workspace-modal__state--loading ui-status ui-status--info">
            Загрузка репозиториев…
          </p>
        ) : error ? (
          <p className="workspace-modal__state workspace-modal__state--error ui-status ui-status--danger">{error}</p>
        ) : repositories.length === 0 ? (
          <p className="workspace-modal__state workspace-modal__state--empty ui-status ui-status--info">
            Репозитории для подключения не найдены.
          </p>
        ) : (
          <div className="repository-table-wrap">
            <table className="repository-table">
              <colgroup>
                <col />
                <col />
                <col />
                <col />
                <col />
              </colgroup>
              <thead>
                <tr className="repository-table__header">
                  <th scope="col" aria-label="Выбрать репозиторий" />
                  <th scope="col">Репозиторий</th>
                  <th scope="col">Провайдер</th>
                  <th scope="col">Ветка по умолчанию</th>
                  <th scope="col">Ссылка</th>
                </tr>
              </thead>
              <tbody>
                {repositories.map((repo) => (
                  <tr key={repo.external_id} className="repository-table__row">
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(repo.external_id)}
                        onChange={() => onToggleRepo(repo.external_id)}
                        aria-label={`Выбрать ${repo.full_path}`}
                      />
                    </td>
                    <td className="repository-table__name">{repo.full_path}</td>
                    <td>{repo.provider}</td>
                    <td>{repo.default_branch}</td>
                    <td>
                      <a href={repo.web_url} target="_blank" rel="noreferrer">
                        открыть
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {applyError && <p className="workspace-modal__state workspace-modal__state--error ui-status ui-status--danger">{applyError}</p>}
        <div className="workspace-modal__actions">
          <button type="button" className="ui-btn ui-btn--secondary" onClick={onClose}>
            Отмена
          </button>
          <button
            type="button"
            className="workspace-modal__confirm ui-btn ui-btn--primary"
            onClick={onApply}
            disabled={applyLoading || repositories.length === 0 || selectedIds.size === 0}
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  )
}

export default RepositoryPickerModal
