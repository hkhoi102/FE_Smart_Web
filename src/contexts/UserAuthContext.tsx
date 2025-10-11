import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthService, UserInfo } from '@/services/authService'

interface UserAuthContextType {
  user: UserInfo | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
  accessToken: string | null
  refreshToken: string | null
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined)

export const UserAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)

  useEffect(() => {
    // Kiểm tra token trong localStorage khi khởi động
    const savedUser = localStorage.getItem('user_info')
    const savedAccessToken = localStorage.getItem('user_access_token')
    const savedRefreshToken = localStorage.getItem('user_refresh_token')

    if (savedUser && savedAccessToken) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setAccessToken(savedAccessToken)
        setRefreshToken(savedRefreshToken)
      } catch (error) {
        console.error('Error loading user data:', error)
        localStorage.removeItem('user_info')
        localStorage.removeItem('user_access_token')
        localStorage.removeItem('user_refresh_token')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const loginResponse = await AuthService.login({ email, password })

      // Lấy thông tin user
      const userData = await AuthService.getCurrentUser(loginResponse.accessToken)

      // Chỉ cho phép role USER
      if (userData.role !== 'USER') {
        return false
      }

      setUser(userData)
      setAccessToken(loginResponse.accessToken)
      setRefreshToken(loginResponse.refreshToken)

      localStorage.setItem('user_info', JSON.stringify(userData))
      localStorage.setItem('user_access_token', loginResponse.accessToken)
      localStorage.setItem('user_refresh_token', loginResponse.refreshToken)

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
      localStorage.removeItem('user_info')
      localStorage.removeItem('user_access_token')
      localStorage.removeItem('user_refresh_token')
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
    <UserAuthContext.Provider value={value}>
      {children}
    </UserAuthContext.Provider>
  )
}

export const useUserAuth = () => {
  const context = useContext(UserAuthContext)
  if (context === undefined) {
    throw new Error('useUserAuth must be used within a UserAuthProvider')
  }
  return context
}
