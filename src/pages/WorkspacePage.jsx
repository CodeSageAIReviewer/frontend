import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  connectRepositories,
  createIntegration,
  createWorkspace,
  deleteIntegration,
  deleteRepository,
  deleteWorkspace,
  listAvailableRepositories,
  listIntegrations,
  listRepositories,
  listWorkspaces,
  updateIntegration,
  updateWorkspace,
} from '../services/workspaceClient'
import WorkspaceSidebar from './workspace/WorkspaceSidebar'
import WorkspaceContent from './workspace/WorkspaceContent'
import RepositoryPickerModal from './workspace/RepositoryPickerModal'
import './WorkspacePage.css'

const initialIntegrationForm = {
  name: '',
  provider: 'github',
  base_url: '',
  access_token: '',
  refresh_token: '',
}

function WorkspacePage() {
  const [workspaces, setWorkspaces] = useState([])
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null)
  const [creatingWorkspace, setCreatingWorkspace] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [workspaceSettingsName, setWorkspaceSettingsName] = useState('')
  const [settingsError, setSettingsError] = useState('')
  const [isUpdatingWorkspace, setIsUpdatingWorkspace] = useState(false)
  const [isIntegrationSettingsOpen, setIsIntegrationSettingsOpen] = useState(false)
  const [integrationSettingsTarget, setIntegrationSettingsTarget] = useState(null)
  const [integrationSettingsForm, setIntegrationSettingsForm] = useState({
    name: '',
    base_url: '',
    access_token: '',
    refresh_token: '',
  })
  const [integrationSettingsError, setIntegrationSettingsError] = useState('')
  const [isUpdatingIntegration, setIsUpdatingIntegration] = useState(false)
  const [isIntegrationDeleteModalOpen, setIsIntegrationDeleteModalOpen] = useState(false)
  const [integrationDeleteTarget, setIntegrationDeleteTarget] = useState(null)
  const [integrationDeleteError, setIntegrationDeleteError] = useState('')
  const [isDeletingIntegration, setIsDeletingIntegration] = useState(false)
  const [isRepositoryDeleteModalOpen, setIsRepositoryDeleteModalOpen] = useState(false)
  const [repositoryDeleteTarget, setRepositoryDeleteTarget] = useState(null)
  const [repositoryDeleteError, setRepositoryDeleteError] = useState('')
  const [isDeletingRepository, setIsDeletingRepository] = useState(false)
  const [activeNode, setActiveNode] = useState({ type: 'workspace', id: null, workspaceId: null, label: '' })
  const [openIntegrations, setOpenIntegrations] = useState({})
  const [openRepos, setOpenRepos] = useState({})
  const [integrations, setIntegrations] = useState([])
  const [integrationsLoading, setIntegrationsLoading] = useState(false)
  const [integrationsError, setIntegrationsError] = useState('')
  const [isAddingIntegration, setIsAddingIntegration] = useState(false)
  const [integrationForm, setIntegrationForm] = useState(initialIntegrationForm)
  const [integrationFormError, setIntegrationFormError] = useState('')
  const [isSubmittingIntegration, setIsSubmittingIntegration] = useState(false)
  const [repoModalState, setRepoModalState] = useState({ isOpen: false, integration: null })
  const [availableRepos, setAvailableRepos] = useState([])
  const [availableReposLoading, setAvailableReposLoading] = useState(false)
  const [availableReposError, setAvailableReposError] = useState('')
  const [selectedRepoIds, setSelectedRepoIds] = useState(new Set())
  const [repoSaveLoading, setRepoSaveLoading] = useState(false)
  const [repoSaveError, setRepoSaveError] = useState('')
  const [savedRepositories, setSavedRepositories] = useState({})
  const [savedRepositoriesLoading, setSavedRepositoriesLoading] = useState(false)
  const [savedRepositoriesError, setSavedRepositoriesError] = useState('')

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId),
    [workspaces, selectedWorkspaceId],
  )

  const activeIntegration = useMemo(() => {
    if (!activeNode) {
      return null
    }
    if (activeNode.type === 'integration') {
      return integrations.find((integration) => integration.id === activeNode.id) ?? null
    }
    if (activeNode.type === 'repository') {
      const [integrationId] = `${activeNode.id}`.split('-')
      return integrations.find((integration) => `${integration.id}` === integrationId) ?? null
    }
    return null
  }, [activeNode, integrations])

  const canDeleteWorkspace = useMemo(() => {
    if (!selectedWorkspace) {
      return false
    }
    if (selectedWorkspace.is_admin) {
      return true
    }
    const normalizedRole = selectedWorkspace.role?.toLowerCase()
    return normalizedRole === 'admin' || normalizedRole === 'owner'
  }, [selectedWorkspace])

  const canEditWorkspace = canDeleteWorkspace

  const fetchWorkspaces = useCallback(async () => {
    try {
      const data = (await listWorkspaces()) ?? []
      setWorkspaces(data)
      setSelectedWorkspaceId((prev) => prev ?? data?.[0]?.id ?? null)
    } catch (error) {
      console.error(error)
    }
  }, [])

  useEffect(() => {
    fetchWorkspaces()
  }, [fetchWorkspaces])

  const fetchIntegrations = useCallback(
    async (workspaceId) => {
      if (!workspaceId) {
        return
      }
      setIntegrationsLoading(true)
      setIntegrationsError('')
      try {
        const data = await listIntegrations(workspaceId)
        setIntegrations(Array.isArray(data) ? data : [])
      } catch (error) {
        setIntegrations([])
        setIntegrationsError(error.message ?? 'Не удалось загрузить интеграции.')
      } finally {
        setIntegrationsLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (!canDeleteWorkspace && isDeleteModalOpen) {
      setIsDeleteModalOpen(false)
    }
  }, [canDeleteWorkspace, isDeleteModalOpen])

  useEffect(() => {
    if (!selectedWorkspaceId) {
      setIntegrations([])
      setIntegrationsError('')
      setIsAddingIntegration(false)
      setIntegrationForm(initialIntegrationForm)
      return
    }
    fetchIntegrations(selectedWorkspaceId)
    setIsAddingIntegration(false)
  }, [selectedWorkspaceId, fetchIntegrations])

  const fetchSavedRepositories = useCallback(
    async (workspaceId) => {
      if (!workspaceId) {
        return
      }

      setSavedRepositoriesLoading(true)
      setSavedRepositoriesError('')
      try {
        const data = await listRepositories(workspaceId)
        const grouped = {}
        Array.isArray(data) &&
          data.forEach((repo) => {
            const integrationId = repo.integration_id
            if (!grouped[integrationId]) {
              grouped[integrationId] = []
            }
            grouped[integrationId].push(repo)
          })
        setSavedRepositories(grouped)
      } catch (error) {
        setSavedRepositories({})
        setSavedRepositoriesError(error.message ?? 'Не удалось загрузить сохранённые репозитории.')
      } finally {
        setSavedRepositoriesLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    fetchSavedRepositories(selectedWorkspaceId)
  }, [selectedWorkspaceId, fetchSavedRepositories])

  useEffect(() => {
    if (!repoModalState.isOpen || !repoModalState.integration || !selectedWorkspaceId) {
      return
    }
    const fetchAvailable = async () => {
      setAvailableReposLoading(true)
      setAvailableReposError('')
      try {
        const data = await listAvailableRepositories(
          selectedWorkspaceId,
          repoModalState.integration.id,
        )
        setAvailableRepos(Array.isArray(data) ? data : [])
      } catch (error) {
        setAvailableRepos([])
        setAvailableReposError(error.message ?? 'Не удалось загрузить репозитории.')
      } finally {
        setAvailableReposLoading(false)
      }
    }
    fetchAvailable()
  }, [repoModalState, selectedWorkspaceId])

  useEffect(() => {
    if (selectedWorkspaceId && activeNode.workspaceId !== selectedWorkspaceId) {
      const workspace = workspaces.find((item) => item.id === selectedWorkspaceId)
      if (workspace) {
        setActiveNode({
          type: 'workspace',
          id: workspace.id,
          workspaceId: workspace.id,
          label: workspace.name,
        })
      }
    }
  }, [selectedWorkspaceId, workspaces, activeNode.workspaceId])

  const handleCreateWorkspace = async (event) => {
    event.preventDefault()
    if (!newWorkspaceName.trim()) {
      setFormError('Введите название, чтобы продолжить.')
      return
    }

    setIsSubmitting(true)
    setFormError('')
    try {
      const createdWorkspace = await createWorkspace({ name: newWorkspaceName.trim() })
      await fetchWorkspaces()
      setSelectedWorkspaceId(createdWorkspace.id ?? null)
      setCreatingWorkspace(false)
      setNewWorkspaceName('')
    } catch (error) {
      setFormError(error.message ?? 'Что-то пошло не так.')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedWorkspace) {
      return
    }

    setIsDeleting(true)
    setDeleteError('')
    try {
      await deleteWorkspace(selectedWorkspace.id)
      setIsDeleteModalOpen(false)
      await fetchWorkspaces()
    } catch (error) {
      setDeleteError(error.message ?? 'Не удалось удалить workspace.')
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleWorkspaceSelect = (workspace) => {
    setSelectedWorkspaceId(workspace.id)
    setActiveNode({
      type: 'workspace',
      id: workspace.id,
      workspaceId: workspace.id,
      label: workspace.name,
    })
    setCreatingWorkspace(false)
    setOpenIntegrations({ [workspace.id]: true })
    setIsAddingIntegration(false)
  }

  const handleIntegrationSelect = (workspace, integration) => {
    setSelectedWorkspaceId(workspace.id)
    setActiveNode({
      type: 'integration',
      id: integration.id,
      label: integration.name,
      parent: workspace.name,
      workspaceId: workspace.id,
    })
    setOpenIntegrations((prev) => ({
      ...prev,
      [workspace.id]: true,
    }))
  }

  const handleRepoSelect = (workspace, integration, repo) => {
    setSelectedWorkspaceId(workspace.id)
    setActiveNode({
      type: 'repository',
      id: `${integration.id}-${repo?.external_id ?? repo}`,
      label: repo?.full_path ?? repo,
      parent: integration.name,
      workspace: workspace.name,
      workspaceId: workspace.id,
      repository: repo,
      integrationId: integration.id,
    })
  }

  const handleToggleIntegrationForm = () => {
    setIsAddingIntegration((prev) => {
      if (prev) {
        setIntegrationForm(initialIntegrationForm)
        setIntegrationFormError('')
      }
      return !prev
    })
  }

  const handleIntegrationFormChange = (field, value) => {
    setIntegrationForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleCreateIntegration = async (event) => {
    event.preventDefault()
    if (!selectedWorkspaceId) {
      return
    }

    const name = integrationForm.name.trim()
    const accessToken = integrationForm.access_token.trim()
    if (!name || !accessToken) {
      setIntegrationFormError('Имя и access token обязательны.')
      return
    }

    setIsSubmittingIntegration(true)
    setIntegrationFormError('')
    const payload = {
      name,
      provider: integrationForm.provider,
      access_token: accessToken,
    }
    if (integrationForm.base_url.trim()) {
      payload.base_url = integrationForm.base_url.trim()
    }
    if (integrationForm.refresh_token.trim()) {
      payload.refresh_token = integrationForm.refresh_token.trim()
    }

    try {
      await createIntegration(selectedWorkspaceId, payload)
      await fetchIntegrations(selectedWorkspaceId)
      setIntegrationForm(initialIntegrationForm)
      setIsAddingIntegration(false)
    } catch (error) {
      setIntegrationFormError(error.message ?? 'Не удалось создать интеграцию.')
    } finally {
      setIsSubmittingIntegration(false)
    }
  }

  const handleBeginWorkspaceCreate = () => {
    setCreatingWorkspace(true)
    setSelectedWorkspaceId(null)
    setActiveNode({ type: 'workspace', id: null, workspaceId: null, label: '' })
  }

  const handleOpenWorkspaceSettings = () => {
    if (!selectedWorkspace || !canEditWorkspace) {
      return
    }
    setWorkspaceSettingsName(selectedWorkspace.name ?? '')
    setSettingsError('')
    setIsSettingsModalOpen(true)
  }

  const handleCloseWorkspaceSettings = () => {
    setIsSettingsModalOpen(false)
    setSettingsError('')
  }

  const handleUpdateWorkspace = async (event) => {
    event.preventDefault()
    if (!selectedWorkspace || !canEditWorkspace) {
      return
    }
    const trimmedName = workspaceSettingsName.trim()
    if (!trimmedName) {
      setSettingsError('Введите имя workspace.')
      return
    }
    if (trimmedName.length > 255) {
      setSettingsError('Название не может быть длиннее 255 символов.')
      return
    }

    setIsUpdatingWorkspace(true)
    setSettingsError('')

    try {
      await updateWorkspace(selectedWorkspace.id, { name: trimmedName })
      await fetchWorkspaces()
      setActiveNode((prev) => {
        if (prev.workspaceId === selectedWorkspaceId) {
          return { ...prev, label: trimmedName }
        }
        return prev
      })
      setIsSettingsModalOpen(false)
    } catch (error) {
      setSettingsError(error.message ?? 'Не удалось обновить workspace.')
    } finally {
      setIsUpdatingWorkspace(false)
    }
  }

  const handleOpenIntegrationSettings = (integration) => {
    if (!selectedWorkspace || !canEditWorkspace) {
      return
    }
    setIntegrationSettingsTarget(integration)
    setIntegrationSettingsForm({
      name: integration?.name ?? '',
      base_url: integration?.base_url ?? '',
      access_token: '',
      refresh_token: '',
    })
    setIntegrationSettingsError('')
    setIsIntegrationSettingsOpen(true)
  }

  const handleCloseIntegrationSettings = () => {
    setIsIntegrationSettingsOpen(false)
    setIntegrationSettingsTarget(null)
    setIntegrationSettingsError('')
  }

  const handleIntegrationSettingsChange = (field, value) => {
    setIntegrationSettingsForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleUpdateIntegration = async (event) => {
    event.preventDefault()
    if (!selectedWorkspaceId || !integrationSettingsTarget || !canEditWorkspace) {
      return
    }

    const payload = {}
    const trimmedName = integrationSettingsForm.name.trim()
    if (trimmedName) {
      payload.name = trimmedName
    }
    const trimmedBaseUrl = integrationSettingsForm.base_url.trim()
    if (trimmedBaseUrl) {
      payload.base_url = trimmedBaseUrl
    }
    if (integrationSettingsForm.access_token.trim()) {
      payload.access_token = integrationSettingsForm.access_token.trim()
    }
    if (integrationSettingsForm.refresh_token.trim()) {
      payload.refresh_token = integrationSettingsForm.refresh_token.trim()
    }

    if (Object.keys(payload).length === 0) {
      setIntegrationSettingsError('Укажите хотя бы одно поле для обновления.')
      return
    }

    setIsUpdatingIntegration(true)
    setIntegrationSettingsError('')

    try {
      await updateIntegration(selectedWorkspaceId, integrationSettingsTarget.id, payload)
      await fetchIntegrations(selectedWorkspaceId)
      setActiveNode((prev) => {
        if (
          prev.type === 'integration' &&
          prev.id === integrationSettingsTarget.id &&
          payload.name
        ) {
          return { ...prev, label: payload.name }
        }
        return prev
      })
      setIsIntegrationSettingsOpen(false)
      setIntegrationSettingsTarget(null)
    } catch (error) {
      setIntegrationSettingsError(error.message ?? 'Не удалось обновить интеграцию.')
    } finally {
      setIsUpdatingIntegration(false)
    }
  }

  const handleOpenIntegrationDelete = () => {
    if (!activeIntegration || !canEditWorkspace) {
      return
    }
    setIntegrationDeleteTarget(activeIntegration)
    setIntegrationDeleteError('')
    setIsIntegrationDeleteModalOpen(true)
  }

  const handleCloseIntegrationDelete = () => {
    setIsIntegrationDeleteModalOpen(false)
    setIntegrationDeleteTarget(null)
    setIntegrationDeleteError('')
  }

  const handleConfirmIntegrationDelete = async () => {
    if (!selectedWorkspaceId || !integrationDeleteTarget || !canEditWorkspace) {
      return
    }

    setIsDeletingIntegration(true)
    setIntegrationDeleteError('')

    try {
      await deleteIntegration(selectedWorkspaceId, integrationDeleteTarget.id)
      await fetchIntegrations(selectedWorkspaceId)
      setActiveNode({
        type: 'workspace',
        id: selectedWorkspaceId,
        workspaceId: selectedWorkspaceId,
        label: selectedWorkspace?.name ?? '',
      })
      setIsIntegrationDeleteModalOpen(false)
      setIntegrationDeleteTarget(null)
    } catch (error) {
      setIntegrationDeleteError(error.message ?? 'Не удалось удалить интеграцию.')
    } finally {
      setIsDeletingIntegration(false)
    }
  }

  const handleOpenRepositoryDelete = (integration, repo) => {
    if (!canEditWorkspace) {
      return
    }
    setRepositoryDeleteTarget({ integration, repo })
    setRepositoryDeleteError('')
    setIsRepositoryDeleteModalOpen(true)
  }

  const handleCloseRepositoryDelete = () => {
    setIsRepositoryDeleteModalOpen(false)
    setRepositoryDeleteTarget(null)
    setRepositoryDeleteError('')
  }

  const handleConfirmRepositoryDelete = async () => {
    if (!selectedWorkspaceId || !repositoryDeleteTarget || !canEditWorkspace) {
      return
    }

    const { integration, repo } = repositoryDeleteTarget
    if (!repo || !repo.id || !integration || !integration.id) {
      setRepositoryDeleteError('Информация о репозитории или интеграции недоступна.')
      return
    }

    setIsDeletingRepository(true)
    setRepositoryDeleteError('')

    try {
      await deleteRepository(selectedWorkspaceId, repo.id)
      await fetchSavedRepositories(selectedWorkspaceId)
      setActiveNode((prev) => {
        const targetRepoId = repo.external_id ?? repo.id
        if (
          prev.type === 'repository' &&
          prev.id === `${integration.id}-${targetRepoId}`
        ) {
          return {
            type: 'integration',
            id: integration.id,
            label: integration.name,
            workspaceId: selectedWorkspaceId,
          }
        }
        return prev
      })
      setIsRepositoryDeleteModalOpen(false)
      setRepositoryDeleteTarget(null)
    } catch (error) {
      setRepositoryDeleteError(error.message ?? 'Не удалось удалить репозиторий.')
    } finally {
      setIsDeletingRepository(false)
    }
  }

  const handleOpenRepositoryModal = (workspace, integration) => {
    handleIntegrationSelect(workspace, integration)
    setRepoModalState({ isOpen: true, integration })
    setSelectedRepoIds(new Set())
    setRepoSaveError('')
  }

  const closeRepositoryModal = () => {
    setRepoModalState({ isOpen: false, integration: null })
    setSelectedRepoIds(new Set())
    setRepoSaveError('')
  }

  const toggleRepoSelection = (repoId) => {
    setSelectedRepoIds((prev) => {
      const updated = new Set(prev)
      if (updated.has(repoId)) {
        updated.delete(repoId)
      } else {
        updated.add(repoId)
      }
      return updated
    })
  }

  const handleRepositoryModalApply = async () => {
    if (!selectedWorkspaceId || !repoModalState.integration) {
      return
    }

    const payloadRepos = availableRepos
      .filter((repo) => selectedRepoIds.has(repo.external_id))
      .map(({ external_id, name, full_path, default_branch }) => ({
        external_id,
        name,
        full_path,
        default_branch,
      }))

    if (payloadRepos.length === 0) {
      setRepoSaveError('Выберите хотя бы один репозиторий.')
      return
    }

    setRepoSaveLoading(true)
    setRepoSaveError('')

    try {
    await connectRepositories(selectedWorkspaceId, {
      integration_id: repoModalState.integration.id,
      repositories: payloadRepos,
    })
      await fetchSavedRepositories(selectedWorkspaceId)
      closeRepositoryModal()
    } catch (error) {
      setRepoSaveError(error.message ?? 'Не удалось сохранить репозитории.')
    } finally {
      setRepoSaveLoading(false)
    }
  }

  const toggleIntegrations = (workspaceId) => {
    setOpenIntegrations((prev) => ({
      [workspaceId]: !prev[workspaceId],
    }))
  }

  const toggleRepos = (integrationId) => {
    setOpenRepos((prev) => ({
      ...prev,
      [integrationId]: !prev[integrationId],
    }))
  }

  const isRepoOpen = (integrationId) => openRepos[integrationId] ?? true

  const getActiveInfo = () => {
    if (activeNode.type === 'integration') {
      return {
        title: activeNode.label,
        subtitle: `Integration under ${selectedWorkspace?.name ?? 'workspace'}`,
        body: '',
      }
    }
    if (activeNode.type === 'repository') {
      return {
        title: activeNode.label,
        subtitle: `Repository inside ${activeNode.parent ?? 'workspace'}`,
        body: '',
      }
    }
    return {
      title: activeNode.label || 'Active workspace',
      subtitle: activeNode.label ? 'Workspace overview' : '',
      body: selectedWorkspace
        ? `Управляйте участниками, настройками и историями для ${selectedWorkspace.name}.`
        : 'Выберите workspace или создайте новый, чтобы начать.',
    }
  }

  const activeInfo = getActiveInfo()
  const showActivePanel = !creatingWorkspace && (selectedWorkspace || activeNode.type !== 'workspace')

  const renderWorkspaceSettingsModal = () => {
    if (!isSettingsModalOpen || !selectedWorkspace || !canEditWorkspace) {
      return null
    }
    return (
      <div
        className="workspace-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="workspace-settings-title"
      >
        <div className="workspace-modal__content">
          <p className="workspace-modal__eyebrow">Настройки workspace</p>
          <h3 id="workspace-settings-title">Обновить рабочее пространство</h3>
          <form className="workspace-modal__form" onSubmit={handleUpdateWorkspace}>
            <label className="workspace-modal__field">
              <span>Название workspace</span>
              <input
                type="text"
                value={workspaceSettingsName}
                maxLength={255}
                onChange={(event) => setWorkspaceSettingsName(event.target.value)}
                placeholder="Новая рабочая зона"
                autoFocus
              />
            </label>
            {settingsError && <p className="workspace-modal__error">{settingsError}</p>}
            <div className="workspace-modal__actions">
              <button type="button" onClick={handleCloseWorkspaceSettings} disabled={isUpdatingWorkspace}>
                Отмена
              </button>
              <button
                type="submit"
                className="workspace-modal__submit"
                disabled={isUpdatingWorkspace}
              >
                {isUpdatingWorkspace ? 'Применяю…' : 'Применить'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const renderIntegrationSettingsModal = () => {
    if (!isIntegrationSettingsOpen || !integrationSettingsTarget || !selectedWorkspace) {
      return null
    }
    return (
      <div
        className="workspace-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="integration-settings-title"
      >
        <div className="workspace-modal__content">
          <p className="workspace-modal__eyebrow">Настройки интеграции</p>
          <h3 id="integration-settings-title">{integrationSettingsTarget.name}</h3>
          <form className="workspace-modal__form" onSubmit={handleUpdateIntegration}>
            <label className="workspace-modal__field">
              <span>Название</span>
              <input
                type="text"
                value={integrationSettingsForm.name}
                onChange={(event) =>
                  handleIntegrationSettingsChange('name', event.target.value)
                }
                placeholder="Название интеграции"
                autoFocus
              />
            </label>
            <label className="workspace-modal__field">
              <span>Base URL</span>
              <input
                type="url"
                value={integrationSettingsForm.base_url}
                onChange={(event) =>
                  handleIntegrationSettingsChange('base_url', event.target.value)
                }
                placeholder="https://git.example.com"
              />
            </label>
            <label className="workspace-modal__field">
              <span>Access token</span>
              <input
                type="password"
                value={integrationSettingsForm.access_token}
                onChange={(event) =>
                  handleIntegrationSettingsChange('access_token', event.target.value)
                }
              />
            </label>
            <label className="workspace-modal__field">
              <span>Refresh token</span>
              <input
                type="password"
                value={integrationSettingsForm.refresh_token}
                onChange={(event) =>
                  handleIntegrationSettingsChange('refresh_token', event.target.value)
                }
              />
            </label>
            <p className="workspace-modal__hint">
              Оставьте токены пустыми, чтобы не менять их.
            </p>
            {integrationSettingsError && (
              <p className="workspace-modal__error">{integrationSettingsError}</p>
            )}
            <div className="workspace-modal__actions">
              <button
                type="button"
                onClick={handleCloseIntegrationSettings}
                disabled={isUpdatingIntegration}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="workspace-modal__submit"
                disabled={isUpdatingIntegration}
              >
                {isUpdatingIntegration ? 'Применяю…' : 'Применить'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const renderRepositoryDeleteModal = () => {
    if (!isRepositoryDeleteModalOpen || !repositoryDeleteTarget || !selectedWorkspace) {
      return null
    }
    return (
      <div
        className="workspace-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="repository-delete-title"
      >
        <div className="workspace-modal__content">
          <p className="workspace-modal__eyebrow">Удаление репозитория</p>
          <h3 id="repository-delete-title">Вы уверены?</h3>
          <p className="workspace-modal__description">
            Репозиторий «{repositoryDeleteTarget.repo?.full_path}» будет отсоединён от workspace и все данные
            о синхронизации будут удалены. Вы уверены, что хотите продолжить?
          </p>
          {repositoryDeleteError && (
            <p className="workspace-modal__error">{repositoryDeleteError}</p>
          )}
          <div className="workspace-modal__actions">
            <button
              type="button"
              onClick={handleCloseRepositoryDelete}
              disabled={isDeletingRepository}
            >
              Отмена
            </button>
            <button
              type="button"
              className="workspace-modal__confirm"
              onClick={handleConfirmRepositoryDelete}
              disabled={isDeletingRepository}
            >
              {isDeletingRepository ? 'Удаляю…' : 'Удалить репозиторий'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderIntegrationDeleteModal = () => {
    if (!isIntegrationDeleteModalOpen || !integrationDeleteTarget || !selectedWorkspace || !canDeleteWorkspace) {
      return null
    }
    return (
      <div
        className="workspace-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="integration-delete-title"
      >
        <div className="workspace-modal__content">
          <p className="workspace-modal__eyebrow">Удаление интеграции</p>
          <h3 id="integration-delete-title">Вы уверены?</h3>
          <p className="workspace-modal__description">
            Интеграция «{integrationDeleteTarget.name}» будет безвозвратно удалена, включая все связанные
            репозитории и данные. Вы уверены, что хотите продолжить?
          </p>
          {integrationDeleteError && (
            <p className="workspace-modal__error">{integrationDeleteError}</p>
          )}
          <div className="workspace-modal__actions">
            <button
              type="button"
              onClick={handleCloseIntegrationDelete}
              disabled={isDeletingIntegration}
            >
              Отмена
            </button>
            <button
              type="button"
              className="workspace-modal__confirm"
              onClick={handleConfirmIntegrationDelete}
              disabled={isDeletingIntegration}
            >
              {isDeletingIntegration ? 'Удаляю…' : 'Удалить интеграцию'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderWorkspaceDeleteModal = () => {
    if (!isDeleteModalOpen || !selectedWorkspace || !canDeleteWorkspace) {
      return null
    }
    return (
      <div className="workspace-modal" role="dialog" aria-modal="true" aria-labelledby="workspace-delete-title">
        <div className="workspace-modal__content">
          <p className="workspace-modal__eyebrow">Удаление workspace</p>
          <h3 id="workspace-delete-title">Вы уверены?</h3>
          <p className="workspace-modal__description">
            Workspace «{selectedWorkspace.name}» будет бесследно удалён, включая все связанные данные. Вы уверены,
            что хотите продолжить?
          </p>
          {deleteError && <p className="workspace-modal__error">{deleteError}</p>}
          <div className="workspace-modal__actions">
            <button type="button" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>
              Отмена
            </button>
            <button
              type="button"
              className="workspace-modal__confirm"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Удаляем…' : 'Удалить workspace'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <main className="workspace-page">
        <WorkspaceSidebar
          workspaces={workspaces}
          selectedWorkspaceId={selectedWorkspaceId}
          activeNode={activeNode}
          integrations={integrations}
          integrationsLoading={integrationsLoading}
          integrationsError={integrationsError}
          openIntegrations={openIntegrations}
          toggleIntegrations={toggleIntegrations}
          isAddingIntegration={isAddingIntegration}
          handleToggleIntegrationForm={handleToggleIntegrationForm}
          integrationForm={integrationForm}
          integrationFormError={integrationFormError}
          handleIntegrationFormChange={handleIntegrationFormChange}
          handleCreateIntegration={handleCreateIntegration}
          isSubmittingIntegration={isSubmittingIntegration}
          openRepos={openRepos}
          toggleRepos={toggleRepos}
          isRepoOpen={isRepoOpen}
          handleIntegrationSelect={handleIntegrationSelect}
          handleRepoSelect={handleRepoSelect}
          onWorkspaceSelect={handleWorkspaceSelect}
          onCreateWorkspaceClick={handleBeginWorkspaceCreate}
          savedRepositories={savedRepositories}
          savedRepositoriesLoading={savedRepositoriesLoading}
          savedRepositoriesError={savedRepositoriesError}
          onOpenRepositoryModal={handleOpenRepositoryModal}
        />
        <WorkspaceContent
          creatingWorkspace={creatingWorkspace}
          newWorkspaceName={newWorkspaceName}
          onNewWorkspaceNameChange={setNewWorkspaceName}
          handleCreateWorkspace={handleCreateWorkspace}
          formError={formError}
          onCancelCreate={() => setCreatingWorkspace(false)}
          onStartCreate={handleBeginWorkspaceCreate}
          selectedWorkspace={selectedWorkspace}
          showActivePanel={showActivePanel}
          activeInfo={activeInfo}
          canDeleteWorkspace={canDeleteWorkspace}
          canEditWorkspace={canEditWorkspace}
          activeNode={activeNode}
          activeIntegration={activeIntegration}
          onIntegrationSettings={handleOpenIntegrationSettings}
          onIntegrationDelete={handleOpenIntegrationDelete}
          onRepositoryDelete={handleOpenRepositoryDelete}
          onSettingsClick={handleOpenWorkspaceSettings}
          onDeleteClick={() => setIsDeleteModalOpen(true)}
          isSubmitting={isSubmitting}
        />
      </main>
      <RepositoryPickerModal
        isOpen={repoModalState.isOpen}
        workspace={selectedWorkspace}
        integration={repoModalState.integration}
        repositories={availableRepos}
        loading={availableReposLoading}
        error={availableReposError}
        selectedIds={selectedRepoIds}
        onToggleRepo={toggleRepoSelection}
        onClose={closeRepositoryModal}
        onApply={handleRepositoryModalApply}
        applyLoading={repoSaveLoading}
        applyError={repoSaveError}
      />
      {renderWorkspaceSettingsModal()}
      {renderIntegrationSettingsModal()}
      {renderRepositoryDeleteModal()}
      {renderIntegrationDeleteModal()}
      {renderWorkspaceDeleteModal()}
    </>
  )
}

export default WorkspacePage
