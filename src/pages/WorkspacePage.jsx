import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  connectRepositories,
  createIntegration,
  createWorkspace,
  deleteWorkspace,
  listAvailableRepositories,
  listIntegrations,
  listRepositories,
  listWorkspaces,
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
        body: 'Здесь будут синхронизационные настройки, метрики и документация для интеграции.',
      }
    }
    if (activeNode.type === 'repository') {
      return {
        title: activeNode.label,
        subtitle: `Repository inside ${activeNode.parent ?? 'workspace'}`,
        body: 'Тут может быть информация о статусе, ветках и последних деплоях.',
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
      {isDeleteModalOpen && selectedWorkspace && canDeleteWorkspace && (
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
      )}
    </>
  )
}

export default WorkspacePage
