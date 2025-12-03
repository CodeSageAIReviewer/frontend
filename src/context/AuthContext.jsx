import { createContext, useContext, useMemo, useState } from 'react'
import Cookies from 'js-cookie'
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../constants/tokenKeys'

const AuthContext = createContext(null)

const getTokensFromCookies = () => ({
  access_token: Cookies.get(ACCESS_TOKEN_KEY) ?? '',
  refresh_token: Cookies.get(REFRESH_TOKEN_KEY) ?? '',
})

const tokenAttributes = {
  sameSite: 'lax',
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
  path: '/',
}

const persistToken = (key, value) => {
  if (!value) {
    Cookies.remove(key)
    return
  }
  Cookies.set(key, value, tokenAttributes)
}

const normalizeTokens = (payload = {}) => {
  const access =
    payload.access_token ??
    payload.access ??
    payload.accessToken ??
    payload.data?.access_token ??
    payload.data?.access ??
    ''
  const refresh =
    payload.refresh_token ??
    payload.refresh ??
    payload.refreshToken ??
    payload.data?.refresh_token ??
    payload.data?.refresh ??
    ''

  return { access_token: access, refresh_token: refresh }
}

export const AuthProvider = ({ children }) => {
  const [tokens, setTokens] = useState(getTokensFromCookies)

  const login = (payload) => {
    const normalized = normalizeTokens(payload)
    persistToken(ACCESS_TOKEN_KEY, normalized.access_token)
    persistToken(REFRESH_TOKEN_KEY, normalized.refresh_token)
    setTokens(normalized)
  }

  const logout = () => {
    Cookies.remove(ACCESS_TOKEN_KEY)
    Cookies.remove(REFRESH_TOKEN_KEY)
    setTokens({ access_token: '', refresh_token: '' })
  }

  const value = useMemo(
    () => ({
      ...tokens,
      isAuthenticated: Boolean(tokens.access_token && tokens.refresh_token),
      login,
      logout,
    }),
    [tokens],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
