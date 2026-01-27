import { useCallback, useEffect, useMemo, useState } from 'react'
import { listLlmIntegrations } from '../../services/llmClient'
import {
  cancelReviewRun,
  getReviewRunDetail,
  listReviewComments,
  listReviewRuns,
  publishReviewRun,
  rerunReviewRun,
  runReview,
} from '../../services/reviewClient'
import { listMergeRequests, syncMergeRequests } from '../../services/workspaceClient'

const statusLabelMap = {
  open: 'Open',
  merged: 'Merged',
  closed: 'Closed',
}

const reviewStatusLabelMap = {
  queued: 'В очереди',
  running: 'Выполняется',
  succeeded: 'Успешно',
  success: 'Успешно',
  completed: 'Готово',
  failed: 'Ошибка',
  error: 'Ошибка',
  canceled: 'Отменено',
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

const formatDateTime = (isoString) => {
  if (!isoString) {
    return ''
  }
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) {
    return isoString
  }
  return date.toLocaleString('ru-RU')
}

const formatDuration = (start, end) => {
  if (!start || !end) {
    return ''
  }
  const startTime = new Date(start).getTime()
  const endTime = new Date(end).getTime()
  if (Number.isNaN(startTime) || Number.isNaN(endTime) || endTime <= startTime) {
    return ''
  }
  const totalSeconds = Math.floor((endTime - startTime) / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes <= 0) {
    return `${seconds}с`
  }
  return `${minutes}м ${seconds}с`
}

const buildRunLabel = (run) => {
  if (!run) {
    return '—'
  }
  const integrationName =
    run.llm_integration_name ||
    run.llm_name ||
    run.integration_name ||
    run.llm_integration?.name
  if (integrationName) {
    return integrationName
  }
  const provider = run.provider || run.llm_provider || run.llm_integration?.provider
  const model = run.model || run.llm_model || run.llm_integration?.model
  if (provider && model) {
    return `${provider} · ${model}`
  }
  if (model) {
    return model
  }
  if (provider) {
    return provider
  }
  return `Review #${run.id ?? run.review_run_id ?? '—'}`
}

const buildRunSummary = (run) => {
  if (!run) {
    return ''
  }
  return (
    run.summary ||
    run.short_summary ||
    run.result_summary ||
    reviewStatusLabelMap[run.status] ||
    run.status ||
    ''
  )
}

const toJsonString = (value) => {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'string') {
    return value
  }
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
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
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [selectedReviewMr, setSelectedReviewMr] = useState(null)
  const [activeReviewRunId, setActiveReviewRunId] = useState(null)
  const [selectedLlmIntegrationId, setSelectedLlmIntegrationId] = useState('')
  const [llmIntegrations, setLlmIntegrations] = useState([])
  const [llmIntegrationsLoading, setLlmIntegrationsLoading] = useState(false)
  const [llmIntegrationsError, setLlmIntegrationsError] = useState('')
  const [reviewRuns, setReviewRuns] = useState([])
  const [reviewRunsLoading, setReviewRunsLoading] = useState(false)
  const [reviewRunsError, setReviewRunsError] = useState('')
  const [reviewDetail, setReviewDetail] = useState(null)
  const [reviewDetailLoading, setReviewDetailLoading] = useState(false)
  const [reviewDetailError, setReviewDetailError] = useState('')
  const [reviewComments, setReviewComments] = useState([])
  const [reviewCommentsLoading, setReviewCommentsLoading] = useState(false)
  const [reviewCommentsError, setReviewCommentsError] = useState('')
  const [reviewFilters, setReviewFilters] = useState({
    severity: '',
    commentType: '',
    filePath: '',
  })
  const [actionError, setActionError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [isRunningReview, setIsRunningReview] = useState(false)
  const [isRerunningReview, setIsRerunningReview] = useState(false)
  const [isCancelingReview, setIsCancelingReview] = useState(false)
  const [isPublishingReview, setIsPublishingReview] = useState(false)
  const [reviewRefreshKey, setReviewRefreshKey] = useState(0)
  const [queueRefreshIn, setQueueRefreshIn] = useState(0)
  const [publishOnComplete, setPublishOnComplete] = useState(true)

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

  const selectedMrId = useMemo(
    () =>
      selectedReviewMr?.id ??
      selectedReviewMr?.external_id ??
      selectedReviewMr?.iid ??
      null,
    [selectedReviewMr],
  )

  const activeReviewRun = useMemo(() => {
    if (!reviewRuns.length) {
      return null
    }
    const matched = reviewRuns.find(
      (run) => String(run.id ?? run.review_run_id) === String(activeReviewRunId),
    )
    return matched ?? reviewRuns[0]
  }, [reviewRuns, activeReviewRunId])

  const availableFiles = useMemo(() => {
    const files = new Set()
    reviewComments.forEach((comment) => {
      const file = comment.file_path || comment.file || comment.path
      if (file) {
        files.add(file)
      }
    })
    return Array.from(files)
  }, [reviewComments])

  const commentCount = reviewComments.length
  const errorCount = reviewComments.filter((comment) => comment.severity === 'error').length
  const fileCount = availableFiles.length
  const canCancelReview =
    activeReviewRun?.status === 'queued' || activeReviewRun?.status === 'running'

  const resetReviewState = useCallback(() => {
    setReviewRuns([])
    setReviewRunsError('')
    setReviewRunsLoading(false)
    setReviewDetail(null)
    setReviewDetailError('')
    setReviewDetailLoading(false)
    setReviewComments([])
    setReviewCommentsError('')
    setReviewCommentsLoading(false)
    setReviewFilters({ severity: '', commentType: '', filePath: '' })
    setActionError('')
    setActionMessage('')
    setActiveReviewRunId(null)
    setSelectedLlmIntegrationId('')
    setLlmIntegrations([])
    setLlmIntegrationsError('')
    setLlmIntegrationsLoading(false)
    setPublishOnComplete(true)
  }, [])

  const fetchReviewRuns = useCallback(
    async (mrId, { keepActiveId = false } = {}) => {
      if (!workspaceId || !mrId) {
        return []
      }
      setReviewRunsLoading(true)
      setReviewRunsError('')
      try {
        const data = await listReviewRuns(workspaceId, mrId)
        const runs = Array.isArray(data) ? data : []
        setReviewRuns(runs)
        if (!keepActiveId) {
          setActiveReviewRunId(runs[0]?.id ?? runs[0]?.review_run_id ?? null)
        }
        return runs
      } catch (error) {
        setReviewRunsError(error.message ?? 'Не удалось загрузить историю ревью.')
        return []
      } finally {
        setReviewRunsLoading(false)
      }
    },
    [workspaceId],
  )

  const fetchLlmList = useCallback(async () => {
    setLlmIntegrationsLoading(true)
    setLlmIntegrationsError('')
    try {
      const data = await listLlmIntegrations()
      const integrations = Array.isArray(data) ? data : []
      setLlmIntegrations(integrations)
      setSelectedLlmIntegrationId((prev) => {
        if (prev) {
          return prev
        }
        if (integrations[0]?.id !== undefined) {
          return String(integrations[0].id)
        }
        return ''
      })
    } catch (error) {
      setLlmIntegrationsError(error.message ?? 'Не удалось загрузить LLM интеграции.')
    } finally {
      setLlmIntegrationsLoading(false)
    }
  }, [])

  const handleOpenReview = useCallback(
    (mr) => {
      if (!mr) {
        return
      }
      resetReviewState()
      setSelectedReviewMr(mr)
      setIsReviewModalOpen(true)
    },
    [resetReviewState],
  )

  const handleCloseReview = useCallback(() => {
    setIsReviewModalOpen(false)
    setSelectedReviewMr(null)
    resetReviewState()
  }, [resetReviewState])

  const handleReviewItemKeyDown = useCallback(
    (event, mr) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleOpenReview(mr)
      }
    },
    [handleOpenReview],
  )

  const handleRunReview = useCallback(async () => {
    if (!workspaceId || !selectedMrId || !selectedLlmIntegrationId) {
      setActionError('Выберите LLM интеграцию перед запуском.')
      return
    }
    setIsRunningReview(true)
    setActionError('')
    setActionMessage('')
    try {
      const payload = {
        llm_integration_id: Number(selectedLlmIntegrationId),
        publish: publishOnComplete ? 'true' : 'false',
      }
      const createdRun = await runReview(workspaceId, selectedMrId, payload)
      const newRunId = createdRun?.id ?? createdRun?.review_run_id
      await fetchReviewRuns(selectedMrId, { keepActiveId: true })
      if (newRunId) {
        setActiveReviewRunId(newRunId)
      }
      setActionMessage('Ревью запущено.')
      setReviewRefreshKey((prev) => prev + 1)
    } catch (error) {
      setActionError(error.message ?? 'Не удалось запустить ревью.')
    } finally {
      setIsRunningReview(false)
    }
  }, [fetchReviewRuns, publishOnComplete, selectedLlmIntegrationId, selectedMrId, workspaceId])

  const handleRerunReview = useCallback(async () => {
    if (!workspaceId || !selectedMrId || !activeReviewRunId) {
      return
    }
    setIsRerunningReview(true)
    setActionError('')
    setActionMessage('')
    try {
      const payload = {
        publish: publishOnComplete ? 'true' : 'false',
      }
      if (selectedLlmIntegrationId) {
        payload.llm_integration_id = Number(selectedLlmIntegrationId)
      }
      const createdRun = await rerunReviewRun(
        workspaceId,
        selectedMrId,
        activeReviewRunId,
        payload,
      )
      const newRunId = createdRun?.id ?? createdRun?.review_run_id
      await fetchReviewRuns(selectedMrId, { keepActiveId: true })
      if (newRunId) {
        setActiveReviewRunId(newRunId)
      }
      setActionMessage('Ревью отправлено на повторный запуск.')
      setReviewRefreshKey((prev) => prev + 1)
    } catch (error) {
      setActionError(error.message ?? 'Не удалось перезапустить ревью.')
    } finally {
      setIsRerunningReview(false)
    }
  }, [
    activeReviewRunId,
    fetchReviewRuns,
    publishOnComplete,
    selectedLlmIntegrationId,
    selectedMrId,
    workspaceId,
  ])

  const handleCancelReview = useCallback(async () => {
    if (!workspaceId || !selectedMrId || !activeReviewRunId) {
      return
    }
    setIsCancelingReview(true)
    setActionError('')
    setActionMessage('')
    try {
      await cancelReviewRun(workspaceId, selectedMrId, activeReviewRunId)
      await fetchReviewRuns(selectedMrId, { keepActiveId: true })
      setActionMessage('Ревью отменено.')
      setReviewRefreshKey((prev) => prev + 1)
    } catch (error) {
      setActionError(error.message ?? 'Не удалось отменить ревью.')
    } finally {
      setIsCancelingReview(false)
    }
  }, [activeReviewRunId, fetchReviewRuns, selectedMrId, workspaceId])

  const handlePublishReview = useCallback(async () => {
    if (!workspaceId || !selectedMrId || !activeReviewRunId) {
      return
    }
    setIsPublishingReview(true)
    setActionError('')
    setActionMessage('')
    try {
      const result = await publishReviewRun(workspaceId, selectedMrId, activeReviewRunId)
      if (result && typeof result === 'object') {
        const posted = result.posted ?? 0
        const providerName = result.provider ? ` · ${result.provider}` : ''
        const targetInfo =
          result.repository_full_path && result.mr_iid
            ? ` (${result.repository_full_path}#${result.mr_iid})`
            : ''
        setActionMessage(
          `Опубликовано: ${posted}${providerName}${targetInfo}.`,
        )
      } else {
        setActionMessage('Комментарии отправлены в MR.')
      }
      setReviewRefreshKey((prev) => prev + 1)
    } catch (error) {
      setActionError(error.message ?? 'Не удалось опубликовать комментарии.')
    } finally {
      setIsPublishingReview(false)
    }
  }, [activeReviewRunId, selectedMrId, workspaceId])

  const handleFilterChange = useCallback((field, value) => {
    setReviewFilters((prev) => ({ ...prev, [field]: value }))
  }, [])

  useEffect(() => {
    if (!isReviewModalOpen) {
      return
    }
    if (!workspaceId || !selectedMrId) {
      setReviewRunsError('Недоступен ID merge request.')
      return
    }
    fetchReviewRuns(selectedMrId)
    fetchLlmList()
  }, [fetchLlmList, fetchReviewRuns, isReviewModalOpen, selectedMrId, workspaceId])

  useEffect(() => {
    if (!isReviewModalOpen) {
      return
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleCloseReview()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleCloseReview, isReviewModalOpen])

  useEffect(() => {
    if (!isReviewModalOpen || !workspaceId || !selectedMrId || !activeReviewRunId) {
      setReviewDetail(null)
      setReviewComments([])
      return
    }

    let cancelled = false

    const fetchDetails = async () => {
      setReviewDetailLoading(true)
      setReviewDetailError('')
      try {
        const data = await getReviewRunDetail(workspaceId, selectedMrId, activeReviewRunId)
        if (!cancelled) {
          setReviewDetail(data)
        }
      } catch (error) {
        if (!cancelled) {
          setReviewDetailError(error.message ?? 'Не удалось загрузить детали ревью.')
        }
      } finally {
        if (!cancelled) {
          setReviewDetailLoading(false)
        }
      }
    }

    const fetchComments = async () => {
      setReviewCommentsLoading(true)
      setReviewCommentsError('')
      try {
        const params = {}
        if (reviewFilters.severity) {
          params.severity = reviewFilters.severity
        }
        if (reviewFilters.commentType) {
          params.comment_type = reviewFilters.commentType
        }
        if (reviewFilters.filePath) {
          params.file_path = reviewFilters.filePath
        }
        const data = await listReviewComments(
          workspaceId,
          selectedMrId,
          activeReviewRunId,
          params,
        )
        if (!cancelled) {
          setReviewComments(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        if (!cancelled) {
          setReviewCommentsError(error.message ?? 'Не удалось загрузить комментарии.')
        }
      } finally {
        if (!cancelled) {
          setReviewCommentsLoading(false)
        }
      }
    }

    fetchDetails()
    fetchComments()

    return () => {
      cancelled = true
    }
  }, [
    activeReviewRunId,
    isReviewModalOpen,
    reviewFilters,
    reviewRefreshKey,
    selectedMrId,
    workspaceId,
  ])

  useEffect(() => {
    const shouldPoll = activeReviewRun?.status === 'queued' || activeReviewRun?.status === 'running'
    if (!isReviewModalOpen || !workspaceId || !selectedMrId || !shouldPoll) {
      setQueueRefreshIn(0)
      return
    }

    setQueueRefreshIn(15)

    const intervalId = window.setInterval(() => {
      setQueueRefreshIn((prev) => {
        if (prev <= 1) {
          void fetchReviewRuns(selectedMrId, { keepActiveId: true })
            .then(() => {
              setReviewRefreshKey((current) => current + 1)
            })
            .catch(() => undefined)
          return 15
        }
        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [activeReviewRun?.status, fetchReviewRuns, isReviewModalOpen, selectedMrId, workspaceId])

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
                className="merge-requests-list__item merge-requests-list__item--clickable"
                role="button"
                tabIndex={0}
                onClick={() => handleOpenReview(mr)}
                onKeyDown={(event) => handleReviewItemKeyDown(event, mr)}
              >
                <div className="merge-requests-list__row">
                  <div className="merge-requests-list__title-row">
                    <span className="merge-requests-list__title">
                      #{mr.iid} {mr.title}
                    </span>
                    {mr.web_url && (
                      <a
                        className="merge-requests-list__external"
                        href={mr.web_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                      >
                        ↗
                      </a>
                    )}
                  </div>
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
      {isReviewModalOpen && selectedReviewMr && (
        <div className="review-modal" onClick={handleCloseReview}>
          <div
            className="review-modal__content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mr-review-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="review-modal__header">
              <div>
                <p className="review-modal__eyebrow">AI Review для merge request</p>
                <h2 id="mr-review-title">
                  MR #{selectedReviewMr.iid ?? selectedReviewMr.id ?? '—'} ·{' '}
                  {selectedReviewMr.title}
                </h2>
                <p className="review-modal__meta">
                  {selectedReviewMr.author_name} ·{' '}
                  {formatRequestDate(selectedReviewMr.created_at)} ·{' '}
                  {selectedReviewMr.source_branch} → {selectedReviewMr.target_branch}
                </p>
              </div>
              <div className="review-modal__header-actions">
                {selectedReviewMr.web_url && (
                  <a
                    className="review-modal__link"
                    href={selectedReviewMr.web_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Открыть MR
                  </a>
                )}
                <button type="button" className="review-modal__close" onClick={handleCloseReview}>
                  Закрыть
                </button>
              </div>
            </header>
            <div className="review-modal__body">
              <div className="review-sidebar">
                <section className="review-panel">
                  <div className="review-panel__header">
                    <h3>Запуск AI-ревью</h3>
                    <span
                      className={`review-status review-status--${
                        activeReviewRun?.status ?? 'info'
                      }`}
                    >
                      {activeReviewRun?.status
                        ? reviewStatusLabelMap[activeReviewRun.status] ??
                          activeReviewRun.status
                        : 'Нет запусков'}
                    </span>
                  </div>
                  <label className="review-field">
                    <span>LLM интеграция</span>
                    <select
                      value={selectedLlmIntegrationId}
                      onChange={(event) => setSelectedLlmIntegrationId(event.target.value)}
                      disabled={llmIntegrationsLoading || llmIntegrations.length === 0}
                    >
                      <option value="">Выберите интеграцию</option>
                      {llmIntegrations.map((integration) => (
                        <option key={integration.id} value={String(integration.id)}>
                          {integration.name ?? buildRunLabel(integration)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {llmIntegrationsLoading && (
                    <p className="review-empty">Загружаю список интеграций…</p>
                  )}
                  {llmIntegrationsError && (
                    <p className="review-error">{llmIntegrationsError}</p>
                  )}
                  {!llmIntegrationsLoading &&
                    !llmIntegrationsError &&
                    llmIntegrations.length === 0 && (
                      <p className="review-empty">
                        У вас пока нет LLM интеграций. Добавьте их в разделе LLM.
                      </p>
                    )}
                  <div className="review-panel__actions">
                    <button
                      type="button"
                      className="review-action"
                      onClick={handleRunReview}
                      disabled={!selectedLlmIntegrationId || isRunningReview}
                    >
                      {isRunningReview ? 'Запускаю…' : 'Run AI Review'}
                    </button>
                    <button
                      type="button"
                      className="review-action review-action--ghost"
                      onClick={handleRerunReview}
                      disabled={!activeReviewRunId || isRerunningReview}
                    >
                      {isRerunningReview ? 'Перезапускаю…' : 'Re-run'}
                    </button>
                  </div>
                  <label className="review-checkbox">
                    <input
                      type="checkbox"
                      checked={publishOnComplete}
                      onChange={(event) => setPublishOnComplete(event.target.checked)}
                    />
                    <span>Публиковать комментарии после завершения</span>
                  </label>
                  <p className="review-panel__hint">
                    Запуск создаст новую запись в истории ревью. Здесь появится статус и
                    результаты.
                  </p>
                  {(activeReviewRun?.status === 'queued' ||
                    activeReviewRun?.status === 'running') &&
                    queueRefreshIn > 0 && (
                      <p className="review-queue-timer">
                        Обновление статуса через {queueRefreshIn}с
                      </p>
                    )}
                  {actionError && <p className="review-error">{actionError}</p>}
                  {actionMessage && <p className="review-success">{actionMessage}</p>}
                </section>
                <section className="review-panel">
                  <div className="review-panel__header">
                    <h3>История запусков</h3>
                    <span className="review-panel__count">{reviewRuns.length}</span>
                  </div>
                  {reviewRunsLoading ? (
                    <p className="review-empty">Загружаю историю ревью…</p>
                  ) : reviewRunsError ? (
                    <p className="review-error">{reviewRunsError}</p>
                  ) : reviewRuns.length === 0 ? (
                    <p className="review-empty">Запусков пока нет.</p>
                  ) : (
                    <div className="review-runs">
                      {reviewRuns.map((run, index) => {
                        const runId = run.id ?? run.review_run_id
                        const hasRunId = runId !== undefined && runId !== null
                        const isActive =
                          runId !== undefined &&
                          String(runId) === String(activeReviewRunId)
                        return (
                          <button
                            key={String(runId ?? `run-${index}`)}
                            type="button"
                            className={`review-run ${isActive ? 'review-run--active' : ''}`}
                            onClick={() => hasRunId && setActiveReviewRunId(runId)}
                            disabled={!hasRunId}
                          >
                            <div className="review-run__top">
                              <span
                                className={`review-status review-status--${run.status}`}
                              >
                                {reviewStatusLabelMap[run.status] ?? run.status}
                              </span>
                              <span className="review-run__date">
                                {formatDateTime(
                                  run.created_at || run.queued_at || run.started_at,
                                ) || '—'}
                              </span>
                            </div>
                            <p className="review-run__title">{buildRunLabel(run)}</p>
                            <p className="review-run__summary">
                              {buildRunSummary(run) || '—'}
                            </p>
                            <span className="review-run__duration">
                              {run.duration ||
                                formatDuration(run.started_at, run.finished_at) ||
                                '—'}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </section>
              </div>
              <section className="review-panel review-panel--details">
                <div className="review-panel__header">
                  <div>
                    <h3>Детали ревью</h3>
                    <p className="review-panel__subtitle">
                      {buildRunLabel(activeReviewRun)} ·{' '}
                      {formatDateTime(
                        activeReviewRun?.created_at ||
                          activeReviewRun?.queued_at ||
                          activeReviewRun?.started_at,
                      ) || '—'}
                    </p>
                  </div>
                  <div className="review-panel__actions review-panel__actions--inline">
                    {canCancelReview && (
                      <button
                        type="button"
                        className="review-action review-action--ghost"
                        onClick={handleCancelReview}
                        disabled={isCancelingReview}
                      >
                        {isCancelingReview ? 'Отменяю…' : 'Cancel'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="review-action"
                      onClick={handlePublishReview}
                      disabled={!activeReviewRunId || isPublishingReview}
                    >
                      {isPublishingReview ? 'Публикую…' : 'Publish to MR'}
                    </button>
                  </div>
                </div>
                {reviewDetailLoading && <p className="review-empty">Загружаю детали…</p>}
                {reviewDetailError && <p className="review-error">{reviewDetailError}</p>}
                <div className="review-summary">
                  <div className="review-summary__card">
                    <p>Статус</p>
                    <strong>
                      {activeReviewRun?.status
                        ? reviewStatusLabelMap[activeReviewRun.status]
                        : '—'}
                    </strong>
                  </div>
                  <div className="review-summary__card">
                    <p>Комментарии</p>
                    <strong>{commentCount}</strong>
                  </div>
                  <div className="review-summary__card">
                    <p>Файлы</p>
                    <strong>{fileCount}</strong>
                  </div>
                  <div className="review-summary__card">
                    <p>Серьёзные</p>
                    <strong>{errorCount}</strong>
                  </div>
                </div>
                <div className="review-filters">
                  <label>
                    Severity
                    <select
                      value={reviewFilters.severity}
                      onChange={(event) => handleFilterChange('severity', event.target.value)}
                    >
                      <option value="">All</option>
                      <option value="error">Error</option>
                      <option value="warning">Warning</option>
                      <option value="info">Info</option>
                    </select>
                  </label>
                  <label>
                    Type
                    <select
                      value={reviewFilters.commentType}
                      onChange={(event) =>
                        handleFilterChange('commentType', event.target.value)
                      }
                    >
                      <option value="">All</option>
                      <option value="general">General</option>
                      <option value="code_smell">Code smell</option>
                      <option value="bug">Bug</option>
                      <option value="security">Security</option>
                      <option value="performance">Performance</option>
                      <option value="style">Style</option>
                      <option value="tests">Tests</option>
                      <option value="documentation">Documentation</option>
                    </select>
                  </label>
                  <label>
                    File
                    <select
                      value={reviewFilters.filePath}
                      onChange={(event) =>
                        handleFilterChange('filePath', event.target.value)
                      }
                    >
                      <option value="">All files</option>
                      {availableFiles.map((file) => (
                        <option key={file} value={file}>
                          {file}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {reviewCommentsLoading ? (
                  <p className="review-empty">Загружаю комментарии…</p>
                ) : reviewCommentsError ? (
                  <p className="review-error">{reviewCommentsError}</p>
                ) : reviewComments.length === 0 ? (
                  <p className="review-empty">Комментариев пока нет.</p>
                ) : (
                  <div className="review-comments">
                    {reviewComments.map((comment, index) => {
                      const commentId = comment.id ?? `comment-${index}`
                      const severity = comment.severity ?? 'info'
                      const type = comment.comment_type || comment.type || 'general'
                      const file = comment.file_path || comment.file || comment.path
                      const line = comment.line ?? comment.line_number
                      const postedToVcs = Boolean(comment.posted_to_vcs)
                      const message =
                        comment.message ||
                        comment.text ||
                        comment.body ||
                        comment.content ||
                        ''
                      return (
                        <div key={commentId} className="review-comment">
                          <div className="review-comment__header">
                            <span
                              className={`review-comment__badge review-comment__badge--${severity}`}
                            >
                              {severity}
                            </span>
                            <span className="review-comment__type">{type}</span>
                            <span className="review-comment__file">
                              {file || '—'}
                              {line ? `:${line}` : ''}
                            </span>
                            <span
                              className={`review-comment__posted ${
                                postedToVcs ? '' : 'review-comment__posted--no'
                              }`}
                            >
                              {postedToVcs ? 'Опубликован' : 'Не опубликован'}
                            </span>
                          </div>
                          <p className="review-comment__text">{message}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
                <div className="review-output">
                  <h4>Structured output</h4>
                  <pre>
                    {toJsonString(
                      reviewDetail?.structured_output ?? reviewDetail?.structured ?? '',
                    ) || 'Нет данных'}
                  </pre>
                </div>
                <div className="review-output">
                  <h4>Raw output</h4>
                  <pre>
                    {toJsonString(reviewDetail?.raw_output ?? reviewDetail?.raw_response ?? '') ||
                      'Нет данных'}
                  </pre>
                </div>
              </section>
            </div>
          </div>
        </div>
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
