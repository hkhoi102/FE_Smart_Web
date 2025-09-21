// Auth Service - API calls for authentication
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  refreshToken: string
}

export interface UserInfo {
  id: number
  fullName: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'USER'
  phoneNumber: string
  active: boolean
}

export interface ErrorResponse {
  message: string
  timestamp: number
}

export class AuthService {
  // Login user
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    const data = await response.json()

    if (data.message) {
      throw new Error(data.message)
    }

    if (!data.accessToken) {
      throw new Error('Invalid response from server')
    }

    return data
  }

  // Get current user info
  static async getCurrentUser(accessToken: string): Promise<UserInfo> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get user info')
    }

    return response.json()
  }

  // Refresh access token
  static async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      throw new Error('Failed to refresh token')
    }

    return response.json()
  }

  // Logout user
  static async logout(refreshToken: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })
    } catch (error) {
      console.error('Logout error:', error)
      // Don't throw error for logout - user should be logged out locally anyway
    }
  }

  // Check if user has admin/manager role
  static hasAdminAccess(user: UserInfo | null): boolean {
    return user ? (user.role === 'ADMIN' || user.role === 'MANAGER') : false
  }
}
