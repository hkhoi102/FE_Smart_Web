// Category Service - API calls for category management
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface Category {
  id: number
  name: string
  description: string
  createdAt?: string
  active?: boolean
  imageUrl?: string
}

export interface CreateCategoryRequest {
  name: string
  description: string
}

export interface UpdateCategoryRequest {
  name: string
  description: string
}

export class CategoryService {
  private static getAuthHeaders(): HeadersInit {
    // Try user token first, fallback to admin token
    const userToken = localStorage.getItem('user_access_token')
    const adminToken = localStorage.getItem('access_token')
    const token = userToken || adminToken

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }

  // Lấy danh sách tất cả categories
  static async getCategories(): Promise<Category[]> {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    // Backend returns: { data: [...], total: ... }
    if (result.data && Array.isArray(result.data)) {
      return result.data
    } else if (Array.isArray(result)) {
      return result
    } else {
      return []
    }
  }

  // Lấy chi tiết category theo ID
  static async getCategoryById(id: number): Promise<Category> {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch category: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  }

  // Tạo category mới
  static async createCategory(categoryData: CreateCategoryRequest): Promise<Category> {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(categoryData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to create category: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  }

  // Tạo category mới với ảnh
  static async createCategoryWithImage(name: string, description: string, imageFile: File): Promise<Category> {
    const formData = new FormData()
    formData.append('name', name)
    formData.append('description', description)
    formData.append('image', imageFile)

    const response = await fetch(`${API_BASE_URL}/categories/with-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('user_access_token') || localStorage.getItem('access_token')}`,
        // Don't set Content-Type for FormData, let browser set it with boundary
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to create category with image: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  }

  // Cập nhật category
  static async updateCategory(id: number, categoryData: UpdateCategoryRequest): Promise<Category> {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(categoryData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to update category: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  }

  // Xóa category (soft delete)
  static async deleteCategory(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to delete category: ${response.statusText}`)
    }
  }
}
