import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthService, UserInfo } from '@/services/authService'

interface AuthContextType {
  user: UserInfo | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
  accessToken: string | null
  refreshToken: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)

  useEffect(() => {
    // Kiểm tra token trong localStorage khi khởi động
    const savedUser = localStorage.getItem('admin_user')
    const savedAccessToken = localStorage.getItem('access_token')
    const savedRefreshToken = localStorage.getItem('refresh_token')

    if (savedUser && savedAccessToken) {
      try {
        setUser(JSON.parse(savedUser))
        setAccessToken(savedAccessToken)
        setRefreshToken(savedRefreshToken)
      } catch (error) {
        localStorage.removeItem('admin_user')
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const loginResponse = await AuthService.login({ email, password })

      // Lấy thông tin user
      const userData = await AuthService.getCurrentUser(loginResponse.accessToken)

      // Kiểm tra role - chỉ cho phép ADMIN hoặc MANAGER
      if (!AuthService.hasAdminAccess(userData)) {
        return false
      }

      setUser(userData)
      setAccessToken(loginResponse.accessToken)
      setRefreshToken(loginResponse.refreshToken)

      localStorage.setItem('admin_user', JSON.stringify(userData))
      localStorage.setItem('access_token', loginResponse.accessToken)
      localStorage.setItem('refresh_token', loginResponse.refreshToken)

      return true
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = async () => {
    try {
      // Gọi API logout để thu hồi refresh token
      if (refreshToken) {
        await AuthService.logout(refreshToken)
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setAccessToken(null)
      setRefreshToken(null)
      localStorage.removeItem('admin_user')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  }

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
    accessToken,
    refreshToken
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
