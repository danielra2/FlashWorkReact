import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [userType, setUserType] = useState(localStorage.getItem('userType'))
  const [userId, setUserId] = useState(localStorage.getItem('userId'))

  function login(data) {
    localStorage.setItem('token', data.token)
    localStorage.setItem('userType', data.userType)
    localStorage.setItem('userId', String(data.userId))
    setToken(data.token)
    setUserType(data.userType)
    setUserId(String(data.userId))
  }

  function logout() {
    localStorage.clear()
    setToken(null)
    setUserType(null)
    setUserId(null)
  }

  return (
    <AuthContext.Provider value={{ token, userType, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
