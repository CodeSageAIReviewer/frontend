import axios from 'axios'
import Cookies from 'js-cookie'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'
const ACCESS_TOKEN_KEY = 'code_sage_access_token'

const client = axios.create({
  baseURL: apiBaseUrl.replace(/\/+$/, ''),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

client.interceptors.request.use((config) => {
  const accessToken = Cookies.get(ACCESS_TOKEN_KEY)
  if (accessToken) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${accessToken}`,
    }
  }
  return config
})

export const listWorkspaces = () => client.get('/workspace/list/')
export const createWorkspace = (payload) => client.post('/workspace/create/', payload)
