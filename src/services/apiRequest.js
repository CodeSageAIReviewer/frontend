import Cookies from 'js-cookie'
import { ACCESS_TOKEN_KEY } from '../constants/tokenKeys'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

export class ApiError extends Error {
  constructor(
    message,
    status,
    code,
    non_field_errors,
    email,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.non_field_errors = non_field_errors
    this.email = email
  }
}

export class Request {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL.replace(/\/+$/, '')
  }

  getDefaultHeaders() {
    const token = Cookies.get(ACCESS_TOKEN_KEY)
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }

  async request(endpoint, options = {}) {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = `${this.baseURL}${normalizedEndpoint}`
    const config = {
      credentials: 'include',
      ...options,
      headers: {
        ...this.getDefaultHeaders(),
        ...(options.headers ?? {}),
      },
    }

    let response
    try {
      response = await fetch(url, config)
    } catch (error) {
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error occurred',
      )
    }

    let data = null
    const text = await response.text()
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        data = text
      }
    }

    if (!response.ok) {
      const payload = typeof data === 'object' && data !== null ? data : {}
      throw new ApiError(
        payload.message || 'Request failed',
        response.status,
        payload.code,
        payload.non_field_errors,
        payload.email,
      )
    }

    return data
  }

  async get(endpoint, params) {
    let url = endpoint
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        url += `?${queryString}`
      }
    }
    return this.request(url, { method: 'GET' })
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    })
  }

  upload(endpoint, file, additionalData) {
    const formData = new FormData()
    formData.append('file', file)
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value))
      })
    }
    const headers = { ...this.getDefaultHeaders() }
    delete headers['Content-Type']
    return this.request(endpoint, {
      method: 'POST',
      headers,
      body: formData,
    })
  }
}

export const apiRequest = new Request()
