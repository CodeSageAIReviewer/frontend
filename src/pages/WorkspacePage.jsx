import { useCallback, useEffect, useMemo, useState } from 'react'
import { createWorkspace, listWorkspaces } from '../services/workspaceClient'
import './WorkspacePage.css'

function WorkspacePage() {
  const [workspaces, setWorkspaces] = useState([])
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null)
  const [creatingWorkspace, setCreatingWorkspace] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId),
    [workspaces, selectedWorkspaceId],
  )

  const fetchWorkspaces = useCallback(async () => {
    try {
      const response = await listWorkspaces()
      const data = response?.data ?? []
      setWorkspaces(data)
      setSelectedWorkspaceId((prev) => prev ?? data?.[0]?.id ?? null)
    } catch (error) {
      console.error(error)
    }
  }, [])

  useEffect(() => {
    fetchWorkspaces()
  }, [fetchWorkspaces])

  const handleCreateWorkspace = async (event) => {
    event.preventDefault()
    if (!newWorkspaceName.trim()) {
      setFormError('Введите название, чтобы продолжить.')
      return
    }

    setIsSubmitting(true)
    setFormError('')
    try {
      const response = await createWorkspace({ name: newWorkspaceName.trim() })
      const createdWorkspace = response?.data
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

  const workspaceTree = useMemo(
    () =>
      workspaces.map((workspace) => {
        const isSelected = workspace.id === selectedWorkspaceId
        return (
          <li key={workspace.id} className="workspace-tree__item">
            <button
              type="button"
              className={`workspace-tree__button ${isSelected ? 'is-active' : ''}`}
              onClick={() => {
                setSelectedWorkspaceId(workspace.id)
                setCreatingWorkspace(false)
              }}
            >
              <span className="workspace-tree__indicator" aria-hidden="true" />
              <span className="workspace-tree__label">{workspace.name}</span>
              <span className="workspace-tree__meta">{workspace.role || 'Member'}</span>
            </button>
          </li>
        )
      }),
    [workspaces, selectedWorkspaceId],
  )

  return (
    <main className="workspace-page">
      <aside className="workspace-sidebar">
          <div className="workspace-sidebar__header">
          <div>
            <p className="workspace-sidebar__eyebrow">Дерево</p>
            <h2 className="workspace-sidebar__title">Workspaces</h2>
          </div>
          <button
            type="button"
            className="workspace-sidebar__create"
            onClick={() => {
              setCreatingWorkspace(true)
              setSelectedWorkspaceId(null)
            }}
          >
            + Создать Workspace
          </button>
        </div>

        <ul className="workspace-tree">{workspaceTree}</ul>
      </aside>

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
                  onChange={(event) => setNewWorkspaceName(event.target.value)}
                  placeholder="My design system..."
                />
              </label>
              {formError && <p className="workspace-form__error">{formError}</p>}
              <div className="workspace-form__actions">
                <button type="button" onClick={() => setCreatingWorkspace(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving…' : 'Create workspace'}
                </button>
              </div>
            </form>
          ) : selectedWorkspace ? (
            <div className="workspace-panel">
              <div className="workspace-panel__heading">
                <div>
                  <p className="workspace-panel__eyebrow">Active workspace</p>
                  <h1>{selectedWorkspace.name}</h1>
                </div>
                <div className="workspace-panel__status">{selectedWorkspace.role}</div>
              </div>
              <p className="workspace-panel__description">
                Создано: {new Date(selectedWorkspace.created_at).toLocaleDateString('ru-RU', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <div className="workspace-panel__actions">
                <button type="button">Добавить участника</button>
                <button type="button">Настройки</button>
                <button type="button">История изменений</button>
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
                <article className="workspace-card">
                  <p className="workspace-card__label">Роль</p>
                  <p className="workspace-card__value">{selectedWorkspace.role || 'Member'}</p>
                </article>
              </div>
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
                <button type="button" onClick={() => setCreatingWorkspace(true)}>
                  + Создать workspace
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default WorkspacePage
