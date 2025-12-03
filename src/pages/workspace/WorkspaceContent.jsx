import { useCallback, useEffect, useState } from 'react'
import { listMergeRequests, syncMergeRequests } from '../../services/workspaceClient'

const statusLabelMap = {
  open: 'Open',
  merged: 'Merged',
  closed: 'Closed',
}

const formatRequestDate = (isoString) => {
  if (!isoString) {
    return ''
  }
  return new Date(isoString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  })
}

function MergeRequestsCard({ workspaceId, repository }) {
  const repositoryId = repository?.id ?? repository?.external_id
  const [mergeRequests, setMergeRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [showAll, setShowAll] = useState(false)
  const [pendingStateFilter, setPendingStateFilter] = useState('')
  const [pendingTitleFilter, setPendingTitleFilter] = useState('')
  const [activeFilters, setActiveFilters] = useState({ state: '', title: '' })
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')

  const handleSyncClick = useCallback(async () => {
    if (!workspaceId || !repositoryId) {
      return
    }
    setIsSyncing(true)
    setSyncMessage('')
    try {
      await syncMergeRequests(workspaceId, repositoryId)
      setSyncMessage('Синхронизация запущена, скоро ваши данные синхронизируются.')
      setRefreshKey((prev) => prev + 1)
    } catch (syncError) {
      setSyncMessage(
        syncError?.message ?? 'Не удалось запустить синхронизацию. Попробуйте позже.',
      )
    } finally {
      setIsSyncing(false)
    }
  }, [repositoryId, workspaceId])

  const handleApplyFilters = useCallback(() => {
    setActiveFilters({ state: pendingStateFilter, title: pendingTitleFilter })
    setRefreshKey((prev) => prev + 1)
    setShowAll(false)
  }, [pendingStateFilter, pendingTitleFilter])

  useEffect(() => {
    if (!workspaceId || !repositoryId) {
      setMergeRequests([])
      setError('')
      setLoading(false)
      return
    }

    let canceled = false

    const fetchMergeRequests = async () => {
      setLoading(true)
      setError('')
      try {
        const params = {}
        if (activeFilters.state) {
          params.state = activeFilters.state
        }
        if (activeFilters.title) {
          params.search = activeFilters.title
        }
        const hasParams = Boolean(Object.keys(params).length)
        const data = await listMergeRequests(
          workspaceId,
          repositoryId,
          hasParams ? params : undefined,
        )
        if (canceled) {
          return
        }
        setMergeRequests(Array.isArray(data) ? data : [])
        setShowAll(false)
      } catch (fetchError) {
        if (canceled) {
          return
        }
        setError(fetchError.message ?? 'Не удалось загрузить merge requests.')
      } finally {
        if (!canceled) {
          setLoading(false)
        }
      }
    }

    fetchMergeRequests()

    return () => {
      canceled = true
    }
  }, [workspaceId, repositoryId, refreshKey, activeFilters])

  const hasExtra = mergeRequests.length > 3
  const visibleRequests = showAll ? mergeRequests : mergeRequests.slice(0, 3)

  return (
    <article className="merge-requests-card">
      <header className="merge-requests-card__header">
        <div>
          <p className="merge-requests-card__label">MERGE REQUESTS FROM GITLAB/GITHUB</p>
          <h2>Merge Requests</h2>
        </div>
        <button
          type="button"
          className="merge-requests-card__sync"
          onClick={handleSyncClick}
          disabled={loading || isSyncing}
        >
          <span className="merge-requests-card__sync-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="presentation" fill="none" stroke="currentColor">
              <path
                d="M4 4v6h6M20 20v-6h-6"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 10a8 8 0 1 0-8 8"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>Синхронизировать</span>
        </button>
      </header>
      <div className="merge-requests-card__filter-row">
        <label className="merge-requests-card__filter">
          <span>Статус</span>
          <select
            value={pendingStateFilter}
            onChange={(event) => {
              setPendingStateFilter(event.target.value)
              setShowAll(false)
            }}
          >
            <option value="">Все</option>
            <option value="open">Open</option>
            <option value="merged">Merged</option>
            <option value="closed">Closed</option>
          </select>
        </label>
        <label className="merge-requests-card__filter merge-requests-card__filter--wide">
          <span>По названию</span>
          <input
            type="text"
            placeholder="Search by title"
            value={pendingTitleFilter}
            onChange={(event) => setPendingTitleFilter(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="merge-requests-card__apply"
          onClick={handleApplyFilters}
          disabled={loading || isSyncing}
        >
          Фильтровать
        </button>
      </div>
      {syncMessage && (
        <p className="merge-requests-card__sync-note">
          <span aria-hidden="true">⟳</span>
          {syncMessage}
        </p>
      )}
      {loading ? (
        <p className="merge-requests-card__status merge-requests-card__status--loading">
          Загружаю merge requests…
        </p>
      ) : error ? (
        <p className="merge-requests-card__status merge-requests-card__status--error">{error}</p>
      ) : mergeRequests.length === 0 ? (
        <div className="merge-requests-card__empty">
          <div className="merge-requests-card__empty-icon" aria-hidden="true">
            <svg viewBox="0 0 68 68">
              <rect x="8" y="16" width="52" height="36" rx="12" fill="#e0e7ff" />
              <path
                d="M18 32h32M18 26h20"
                stroke="#c7d2fe"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="merge-requests-card__empty-title">
            В этом репозитории нет merge requests.
          </p>
          <p className="merge-requests-card__empty-body">
            Синхронизируйте информацию, чтобы увидеть последние запросы на слияние.
          </p>
          <button
            type="button"
            className="merge-requests-card__empty-action"
            onClick={handleSyncClick}
            disabled={loading || isSyncing}
          >
            Синхронизировать
          </button>
        </div>
      ) : (
        <>
          <ul className="merge-requests-list">
            {visibleRequests.map((mr) => (
              <li
                key={mr.id ?? `${mr.external_id}-${mr.iid}` ?? mr.web_url ?? mr.title}
                className="merge-requests-list__item"
              >
                <div className="merge-requests-list__row">
                  <a
                    className="merge-requests-list__title"
                    href={mr.web_url ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                  >
                    #{mr.iid} {mr.title}
                  </a>
                  <span
                    className={`merge-requests-list__status merge-requests-list__status--${mr.state}`}
                  >
                    {statusLabelMap[mr.state] ?? mr.state}
                  </span>
                </div>
                <p className="merge-requests-list__meta">
                  {mr.author_name} · {formatRequestDate(mr.created_at)}
                </p>
                <div className="merge-requests-list__branches">
                  <span>{mr.source_branch}</span>
                  <span aria-hidden="true">→</span>
                  <span>{mr.target_branch}</span>
                </div>
              </li>
            ))}
          </ul>
          {hasExtra && (
            <button
              type="button"
              className="merge-requests-card__toggle"
              onClick={() => setShowAll((prev) => !prev)}
            >
              <span>
                {showAll ? 'Скрыть остальные' : `Показать ещё ${mergeRequests.length - 3}`}
              </span>
              <span
                className={`merge-requests-card__toggle-icon ${
                  showAll ? 'merge-requests-card__toggle-icon--open' : ''
                }`}
                aria-hidden="true"
              />
            </button>
          )}
        </>
      )}
    </article>
  )
}

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
  onRepositoryDelete,
}) {
  const activeRepository =
    activeNode?.type === 'repository' ? activeNode.repository : null
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
        ) : (
          <>
            {showActivePanel ? (
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
                      {canEditWorkspace &&
                        activeNode?.type === 'repository' &&
                        activeIntegration &&
                        activeNode.repository &&
                        onRepositoryDelete && (
                          <button
                            type="button"
                            className="workspace-panel__delete workspace-panel__delete--integration"
                            onClick={() =>
                              onRepositoryDelete(activeIntegration, activeNode.repository)
                            }
                          >
                            Удалить репозиторий
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
                    {activeNode?.type === 'workspace' && (
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
                    )}
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
            {showActivePanel && selectedWorkspace && activeRepository && (
              <MergeRequestsCard
                workspaceId={selectedWorkspace.id}
                repository={activeRepository}
              />
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default WorkspaceContent
