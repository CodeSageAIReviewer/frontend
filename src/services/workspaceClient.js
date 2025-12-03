import { apiRequest } from './apiRequest'

export const listWorkspaces = () => apiRequest.get('/workspace/list/')
export const createWorkspace = (payload) => apiRequest.post('/workspace/create/', payload)
export const deleteWorkspace = (workspaceId) =>
  apiRequest.delete(`/workspace/${workspaceId}/delete/`)
export const updateWorkspace = (workspaceId, payload) =>
  apiRequest.patch(`/workspace/${workspaceId}/update/`, payload)

export const listIntegrations = (workspaceId) =>
  apiRequest.get(`/workspace/${workspaceId}/integrations/list/`)
export const createIntegration = (workspaceId, payload) =>
  apiRequest.post(`/workspace/${workspaceId}/integrations/create/`, payload)
export const listAvailableRepositories = (workspaceId, integrationId) =>
  apiRequest.get(`/workspace/${workspaceId}/integrations/${integrationId}/repositories/available/`)
export const connectRepositories = (workspaceId, payload) =>
  apiRequest.post(`/workspace/${workspaceId}/repositories/connect/`, payload)
export const listRepositories = (workspaceId) =>
  apiRequest.get(`/workspace/${workspaceId}/repositories/list/`)
export const updateIntegration = (workspaceId, integrationId, payload) =>
  apiRequest.patch(
    `/workspace/${workspaceId}/integrations/${integrationId}/update/`,
    payload,
  )
export const deleteIntegration = (workspaceId, integrationId) =>
  apiRequest.delete(
    `/workspace/${workspaceId}/integrations/${integrationId}/delete/`,
  )
export const deleteRepository = (workspaceId, repositoryId) =>
  apiRequest.delete(`/workspace/${workspaceId}/repositories/${repositoryId}/delete/`)
