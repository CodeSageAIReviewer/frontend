import { apiRequest } from './apiRequest'

export const listLlmIntegrations = () => apiRequest.get('/llm/integrations/list/')
export const createLlmIntegration = (payload) =>
  apiRequest.post('/llm/integrations/create/', payload)
export const updateLlmIntegration = (integrationId, payload) =>
  apiRequest.patch(`/llm/integrations/${integrationId}/update/`, payload)
export const deleteLlmIntegration = (integrationId) =>
  apiRequest.delete(`/llm/integrations/${integrationId}/delete/`)
