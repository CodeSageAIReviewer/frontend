import { apiRequest } from './apiRequest'

export const signIn = (payload) => apiRequest.post('/users/login/', payload)
export const signUp = (payload) => apiRequest.post('/users/register/', payload)
export const refreshTokens = (payload) => apiRequest.post('/users/refresh/', payload)
