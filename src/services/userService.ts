// User Service - API calls for user management
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface User {
  id: number
  fullName: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'USER'
  phoneNumber: string
  active: boolean
  defaultWarehouseId?: number | null
  defaultStockLocationId?: number | null
  createdAt?: string
  otp?: string | null
  otpExpiresAt?: string | null
}

export interface UserResponse {
  content: User[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface CreateUserRequest {
  fullName: string
  email: string
  password: string
  phoneNumber: string
  role: 'ADMIN' | 'MANAGER' | 'USER'
  defaultWarehouseId?: number | null
  defaultStockLocationId?: number | null
}

export interface UpdateUserRequest {
  fullName: string
  email: string
  phoneNumber: string
  role: 'ADMIN' | 'MANAGER' | 'USER'
  defaultWarehouseId?: number | null
  defaultStockLocationId?: number | null
}

export interface UpdateStatusRequest {
  active: boolean
}

export interface UpdateRoleRequest {
  role: 'ADMIN' | 'MANAGER' | 'USER'
}

export class UserService {
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }

  // Lấy danh sách users với phân trang và tìm kiếm
  static async getUsers(
    page: number = 0,
    size: number = 10,
    search?: string
  ): Promise<UserResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    })

    if (search) {
      params.append('q', search)
    }

    const response = await fetch(`${API_BASE_URL}/users?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`)
    }

    return response.json()
  }

  // Lấy danh sách users theo role
  static async getUsersByRole(role: string): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users/role/${role}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch users by role: ${response.statusText}`)
    }

    return response.json()
  }

  // Lấy thông tin chi tiết user
  static async getUserById(id: number): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.statusText}`)
    }

    return response.json()
  }

  // Tạo user mới
  static async createUser(userData: CreateUserRequest): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))

      // Handle specific error messages from backend
      if (response.status === 400) {
        if (errorData.error === 'Email exists') {
          throw new Error(JSON.stringify({ error: 'Email exists' }))
        } else if (errorData.error === 'Phone exists') {
          throw new Error(JSON.stringify({ error: 'Phone exists' }))
        }
      }

      throw new Error(errorData.message || errorData.error || `Failed to create user: ${response.statusText}`)
    }

    return response.json()
  }

  // Cập nhật user
  static async updateUser(id: number, userData: UpdateUserRequest): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to update user: ${response.statusText}`)
    }

    return response.json()
  }


  // Cập nhật trạng thái user
  static async updateUserStatus(id: number, active: boolean): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${id}/status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ active }),
    })

    if (!response.ok) {
      throw new Error(`Failed to update user status: ${response.statusText}`)
    }
  }

  // Cập nhật role user
  static async updateUserRole(id: number, role: 'ADMIN' | 'MANAGER' | 'USER'): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${id}/role`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ role }),
    })

    if (!response.ok) {
      throw new Error(`Failed to update user role: ${response.statusText}`)
    }
  }

  // Lấy thông tin user hiện tại
  static async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch current user: ${response.statusText}`)
    }

    return response.json()
  }
}
