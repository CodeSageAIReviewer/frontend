import { apiRequest } from './apiRequest'

export const listWorkspaces = () => apiRequest.get('/workspace/list/')
export const createWorkspace = (payload) => apiRequest.post('/workspace/create/', payload)
export const deleteWorkspace = (workspaceId) =>
  apiRequest.delete(`/workspace/${workspaceId}/delete/`)
