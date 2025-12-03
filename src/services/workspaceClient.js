import { apiRequest } from './apiRequest'

export const listWorkspaces = () => apiRequest.get('/workspace/list/')
export const createWorkspace = (payload) => apiRequest.post('/workspace/create/', payload)
