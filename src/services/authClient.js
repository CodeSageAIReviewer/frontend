import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

const client = axios.create({
  baseURL: apiBaseUrl.replace(/\/+$/, ''),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

export const signIn = (payload) => client.post('/users/login/', payload)
export const signUp = (payload) => client.post('/users/register/', payload)
export const refreshTokens = (payload) => client.post('/users/refresh/', payload)
