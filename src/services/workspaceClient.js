import { apiRequest } from './apiRequest'

export const listWorkspaces = () => apiRequest.get('/workspace/list/')
export const createWorkspace = (payload) => apiRequest.post('/workspace/create/', payload)
export const deleteWorkspace = (workspaceId) =>
  apiRequest.delete(`/workspace/${workspaceId}/delete/`)

export const listIntegrations = (workspaceId) =>
  apiRequest.get(`/workspace/${workspaceId}/integrations/list/`)
export const createIntegration = (workspaceId, payload) =>
  apiRequest.post(`/workspace/${workspaceId}/integrations/create/`, payload)
