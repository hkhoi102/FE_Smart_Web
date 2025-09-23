export interface Product {
  id: number
  name: string
  category_id: number
  category_name: string
  unit: string
  price: number
  status: 'ACTIVE' | 'INACTIVE'
  description?: string
  rating?: number
  created_at: string
  updated_at: string
}

// Base products template
const baseProducts = [
  { name: 'Coca Cola 330ml', category_id: 1, category_name: 'Đồ uống', unit: 'chai', price: 12000, description: 'Nước ngọt có gas hương cola' },
  { name: 'Kẹo dẻo Haribo', category_id: 2, category_name: 'Đồ ăn vặt', unit: 'gói', price: 18000, description: 'Kẹo dẻo nhiều hương vị trái cây' },
  { name: 'Sữa tươi Vinamilk', category_id: 3, category_name: 'Sữa và sản phẩm từ sữa', unit: 'hộp', price: 25000, description: 'Sữa tươi tiệt trùng không đường' },
  { name: 'Nước rửa chén Sunlight', category_id: 4, category_name: 'Hàng gia dụng', unit: 'chai', price: 25000, description: 'Nước rửa bát đĩa khử mùi tanh' },
  { name: 'Bánh mì sandwich', category_id: 5, category_name: 'Bánh', unit: 'cái', price: 15000, description: 'Bánh mì kẹp thịt nguội và rau' },
  { name: 'Pepsi 330ml', category_id: 1, category_name: 'Đồ uống', unit: 'chai', price: 12000, description: 'Nước cola có gas thương hiệu Pepsi' },
  { name: 'Snack khoai tây Pringles', category_id: 2, category_name: 'Đồ ăn vặt', unit: 'hộp', price: 35000, description: 'Snack khoai tây chiên giòn' },
  { name: 'Yaourt Vinamilk', category_id: 3, category_name: 'Sữa và sản phẩm từ sữa', unit: 'hộp', price: 8000, description: 'Sữa chua uống có đường' },
  { name: 'Bột giặt Ariel', category_id: 4, category_name: 'Hàng gia dụng', unit: 'túi', price: 45000, description: 'Bột giặt siêu sạch khử mùi' },
  { name: 'Bánh quy Oreo', category_id: 5, category_name: 'Bánh', unit: 'gói', price: 22000, description: 'Bánh quy chocolate kem vani' }
]

// Generate 150 products
export const mockProducts: Product[] = []
for (let i = 0; i < 150; i++) {
  const baseIndex = i % baseProducts.length
  const base = baseProducts[baseIndex]
  const variation = Math.floor(i / baseProducts.length) + 1
  
  mockProducts.push({
    id: i + 1,
    name: variation > 1 ? `${base.name} (${variation})` : base.name,
    category_id: base.category_id,
    category_name: base.category_name,
    unit: base.unit,
    price: base.price + (variation - 1) * 1000,
    status: 'ACTIVE',
    description: base.description,
    rating: 4.0 + Math.random() * 1.0,
    created_at: '2024-01-15',
    updated_at: '2024-01-15'
  })
}

export interface ProductsResponse {
  products: Product[]
  totalCount: number
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// Legacy interfaces for compatibility
export interface ProductCategory {
  id: number
  name: string
}

export interface ProductUnit {
  id: number
  name: string
  unitName?: string
  isDefault?: boolean
}

export interface CreateProductRequest {
  name: string
  categoryId: number
  description?: string
}

export interface UpdateProductRequest extends CreateProductRequest {
  id: number
}

// Legacy ProductService class for backward compatibility
export class ProductService {
  static async getAll() {
    return mockProducts
  }
  
  static async getCategories() {
    return [
      { id: 1, name: 'Đồ uống' },
      { id: 2, name: 'Đồ ăn vặt' },
      { id: 3, name: 'Sữa và sản phẩm từ sữa' },
      { id: 4, name: 'Hàng gia dụng' },
      { id: 5, name: 'Bánh' }
    ]
  }
  
  static async getUnits() {
    return [
      { id: 1, name: 'chai', unitName: 'chai', isDefault: true },
      { id: 2, name: 'gói', unitName: 'gói', isDefault: false },
      { id: 3, name: 'hộp', unitName: 'hộp', isDefault: false },
      { id: 4, name: 'cái', unitName: 'cái', isDefault: false },
      { id: 5, name: 'ly', unitName: 'ly', isDefault: false }
    ]
  }
  
  static async create(data: CreateProductRequest) {
    const newProduct: Product = {
      id: mockProducts.length + 1,
      name: data.name,
      category_id: data.categoryId,
      category_name: 'Unknown',
      unit: 'cái',
      price: 0,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    mockProducts.push(newProduct)
    return newProduct
  }
  
  static async update(data: UpdateProductRequest) {
    const index = mockProducts.findIndex(p => p.id === data.id)
    if (index >= 0) {
      mockProducts[index] = { ...mockProducts[index], name: data.name, category_id: data.categoryId }
      return mockProducts[index]
    }
    throw new Error('Product not found')
  }
  
  static async delete(id: number) {
    const index = mockProducts.findIndex(p => p.id === id)
    if (index >= 0) {
      mockProducts.splice(index, 1)
      return true
    }
    return false
  }
  
  static async getProducts() {
    return mockProducts
  }
  
  static async getProductUnitById(id: number) {
    const units = await this.getUnits()
    return units.find(u => u.id === id) || { id, name: 'Unknown', unitName: 'Unknown' }
  }
}

export const fetchProducts = async (
  page: number = 1,
  limit: number = 20,
  category?: string,
  searchTerm?: string,
  minPrice?: number,
  maxPrice?: number,
  sortBy: 'name' | 'price' | 'rating' = 'name',
  sortOrder: 'asc' | 'desc' = 'asc'
): Promise<ProductsResponse> => {
  await new Promise(resolve => setTimeout(resolve, 500))

  let filteredProducts = [...mockProducts]

  if (category && category !== 'all') {
    filteredProducts = filteredProducts.filter(product => 
      product.category_name === category
    )
  }

  if (searchTerm) {
    console.log('🔍 Searching for:', searchTerm)
    
    const normalizeVietnamese = (str: string) => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim()
    }
    
    const normalizedSearchTerm = normalizeVietnamese(searchTerm)
    const searchWords = normalizedSearchTerm.split(' ').filter(word => word.length > 0)
    
    filteredProducts = filteredProducts.filter(product => {
      const normalizedName = normalizeVietnamese(product.name)
      const normalizedCategory = normalizeVietnamese(product.category_name)
      const normalizedUnit = normalizeVietnamese(product.unit)
      const normalizedDescription = product.description ? normalizeVietnamese(product.description) : ''
      
      // Combine all searchable text
      const searchableText = `${normalizedName} ${normalizedCategory} ${normalizedUnit} ${normalizedDescription}`
      
      // Check if all search words are found in the searchable text
      return searchWords.every(word => 
        searchableText.includes(word)
      ) || 
      // Or if the full search term is found in any individual field
      normalizedName.includes(normalizedSearchTerm) ||
      normalizedCategory.includes(normalizedSearchTerm) ||
      normalizedUnit.includes(normalizedSearchTerm)
    })
    
    console.log(`📊 Search results: ${filteredProducts.length}/${mockProducts.length} products found`)
  }

  if (minPrice !== undefined) {
    filteredProducts = filteredProducts.filter(product => product.price >= minPrice)
  }
  if (maxPrice !== undefined) {
    filteredProducts = filteredProducts.filter(product => product.price <= maxPrice)
  }

  filteredProducts.sort((a, b) => {
    let aValue: any, bValue: any
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case 'price':
        aValue = a.price
        bValue = b.price
        break
      case 'rating':
        aValue = Math.random() * 5
        bValue = Math.random() * 5
        break
      default:
        return 0
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  const totalCount = filteredProducts.length
  const totalPages = Math.ceil(totalCount / limit)
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  return {
    products: paginatedProducts,
    totalCount,
    currentPage: page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  }
}

const API_BASE_URL = 'http://localhost:8080/api' // Change this to your actual API URL

export class ProductServiceAPI {
  private static getAuthHeaders() {
    const token = localStorage.getItem('authToken')
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  }
  static async deleteProduct(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to delete product: ${res.status} ${res.statusText}`)
  }

  // Import products via Excel file (multipart/form-data)
  static async importProductsExcel(
    file: File,
    options?: { warehouseId?: number; stockLocationId?: number }
  ): Promise<{ totalRows: number; successCount: number; errorCount: number; errors?: any[]; createdProducts?: any[] }> {
    const form = new FormData()
    form.append('file', file)
    if (options?.warehouseId !== undefined) {
      form.append('warehouseId', String(options.warehouseId))
    }
    if (options?.stockLocationId !== undefined) {
      form.append('stockLocationId', String(options.stockLocationId))
    }
    const res = await fetch(`${API_BASE_URL}/products/import/excel`, {
      method: 'POST',
      headers: (() => {
        const headers: Record<string, string> = {}
        const token = localStorage.getItem('access_token')
        if (token) headers['Authorization'] = `Bearer ${token}`
        return headers
      })(),
      body: form,
    })
    if (!res.ok) throw new Error(`Failed to import products: ${res.status} ${res.statusText}`)
    const result = await res.json().catch(() => ({}))
    const data = result.data ?? result
    return {
      totalRows: data.totalRows ?? 0,
      successCount: data.successCount ?? 0,
      errorCount: data.errorCount ?? 0,
      errors: data.errors ?? [],
      createdProducts: data.createdProducts ?? [],
    }
  }

  // Update product image by ID (multipart PUT)
  static async updateProductImage(productId: number, imageFile: File): Promise<Product> {
    const form = new FormData()
    form.append('image', imageFile)
    const res = await fetch(`${API_BASE_URL}/products/${productId}/image`, {
      method: 'PUT',
      headers: (() => {
        const headers: Record<string, string> = {}
        const token = localStorage.getItem('access_token')
        if (token) headers['Authorization'] = `Bearer ${token}`
        return headers
      })(),
      body: form,
    })
    if (!res.ok) throw new Error(`Failed to update product image: ${res.status} ${res.statusText}`)
    const result = await res.json().catch(() => ({}))
    return result.data ?? result
  }

  // Thêm đơn vị tính cho sản phẩm
  static async addProductUnit(
    productId: number,
    payload: { unitId: number; conversionFactor: number; isDefault: boolean }
  ): Promise<Product> {
    const res = await fetch(`${API_BASE_URL}/products/${productId}/units`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`Failed to add product unit: ${res.status} ${res.statusText}`)
    const result = await res.json()
    return result.data ?? result
  }

  static async makeDefaultProductUnit(productId: number, unitId: number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/products/${productId}/units/${unitId}/make-default`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to make default unit: ${res.status} ${res.statusText}`)
    const result = await res.json()
    return result.data ?? result
  }

  // PRICE APIs
  static async getProductPrices(productId: number): Promise<Array<{ id: number; unitId: number; unitName?: string; price: number; isDefault?: boolean; validFrom?: string; validTo?: string }>> {
    const res = await fetch(`${API_BASE_URL}/products/${productId}/prices`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to fetch prices: ${res.status} ${res.statusText}`)
    const result = await res.json()
    return (Array.isArray(result?.data) ? result.data : result) || []
  }

  static async addProductPrice(productId: number, payload: { unitId: number; price: number; validFrom: string; validTo?: string }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/products/${productId}/prices`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        productUnitId: payload.unitId,
        price: payload.price,
        timeStart: payload.validFrom,
        timeEnd: payload.validTo,
      }),
    })
    if (!res.ok) throw new Error(`Failed to add price: ${res.status} ${res.statusText}`)
    const result = await res.json()
    return result.data ?? result
  }

  static async updateProductPrice(productId: number, priceId: number, payload: { unitId: number; price: number; validFrom: string; validTo?: string }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/products/${productId}/prices/${priceId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        productUnitId: payload.unitId,
        price: payload.price,
        timeStart: payload.validFrom,
        timeEnd: payload.validTo,
      }),
    })
    if (!res.ok) throw new Error(`Failed to update price: ${res.status} ${res.statusText}`)
    const result = await res.json()
    return result.data ?? result
  }

  static async deleteProductPrice(productId: number, priceId: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/products/${productId}/prices/${priceId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to delete price: ${res.status} ${res.statusText}`)
  }
}