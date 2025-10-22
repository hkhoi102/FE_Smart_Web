// Product Service - API calls for product management
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface ProductUnit {
  id: number
  unitId: number
  unitName: string
  conversionFactor: number
  isDefault: boolean
  active?: boolean
  code?: string
  currentPrice?: number
  convertedPrice?: number
  quantity?: number
  availableQuantity?: number
}

export interface Barcode {
  id: number
  code: string
  type?: 'BARCODE' | 'QR_CODE'
}

export interface ProductCategory {
  id: number
  name: string
  description?: string
  createdAt?: string
  active?: boolean
}

export interface Product {
  id: number
  name: string
  code?: string
  description: string
  imageUrl?: string | null
  expirationDate?: string | null
  categoryId: number
  categoryName?: string
  createdAt: string
  updatedAt: string
  active: boolean
  defaultUnitId?: number | null
  productUnits?: ProductUnit[]
  barcodes?: Barcode[] | null
  // Some BE returns a flat list of barcodes for the product
  barcodeList?: Array<{ id: number; productUnitId: number; code: string; type?: string }>
}

export interface ProductResponse {
  products: Product[]
  pagination: {
    current_page: number
    total_pages: number
    total_items: number
    items_per_page: number
  }
}

export interface CreateProductRequest {
  name: string
  code?: string
  description: string
  imageUrl?: string
  expirationDate?: string
  categoryId: number
  active?: boolean
  defaultUnitId?: number | null
}

export interface UpdateProductRequest extends CreateProductRequest {}

export class ProductService {
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

  private static toAbsoluteUrl(url?: string | null): string | undefined {
    if (!url) return undefined
    if (/^https?:\/\//i.test(url)) return url
    if (url.startsWith('/api')) return url
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
  }

  // ProductUnit detail by ID (to enrich names in Inventory)
  static async getProductUnitById(id: number): Promise<{ id: number; productId?: number; productName?: string; unitId?: number; unitName?: string } | null> {
    const res = await fetch(`${API_BASE_URL}/products/units/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })
    if (!res.ok) return null
    const result = await res.json().catch(() => null)
    const dto = (result?.data ?? result) || null
    if (!dto) return null
    return {
      id: dto.id ?? id,
      productId: dto.productId ?? dto.product_id,
      productName: dto.productName ?? dto.product_name ?? dto.name,
      unitId: dto.unitId ?? dto.unit_id,
      unitName: dto.unitName ?? dto.unit_name,
    }
  }

  // Lấy danh sách sản phẩm với phân trang và lọc (theo format BE cung cấp)
  static async getProducts(
    page: number = 1,
    limit: number = 10,
    search?: string,
    categoryId?: number
  ): Promise<ProductResponse> {
    const apiPage = Math.max(0, page - 1)
    const params = new URLSearchParams({
      page: apiPage.toString(),
      size: limit.toString(),
      includeInactive: 'true'
    })
    if (search) params.append('search', search)
    if (categoryId) params.append('categoryId', categoryId.toString())

    const res = await fetch(`${API_BASE_URL}/products?${params.toString()}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Failed to fetch products: ${res.status} ${res.statusText}`)
    }
    const result = await res.json()

    const mapUnit = (u: any): ProductUnit => ({
      id: u.id,
      unitId: u.unitId,
      unitName: u.unitName,
      conversionFactor: u.conversionFactor ?? u.conversionRate ?? 1,
      isDefault: u.isDefault,
      active: u.active !== undefined ? u.active : true,
      code: u.code,
      currentPrice: typeof u.currentPrice === 'number' ? u.currentPrice : undefined,
      convertedPrice: typeof u.convertedPrice === 'number' ? u.convertedPrice : undefined,
      quantity: typeof u.quantity === 'number' ? u.quantity : undefined,
      availableQuantity: typeof u.availableQuantity === 'number' ? u.availableQuantity : undefined,
    })

    const mapProduct = (p: any): Product => ({
      id: p.id,
      name: p.name,
      code: p.code,
      description: p.description,
      imageUrl: ProductService.toAbsoluteUrl(p.imageUrl ?? p.image_url) ?? null,
      expirationDate: p.expirationDate ?? null,
      categoryId: p.categoryId,
      categoryName: p.categoryName,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      active: p.active,
      defaultUnitId: p.defaultUnitId ?? null,
      productUnits: Array.isArray(p.productUnits) ? p.productUnits.map(mapUnit) : [],
      barcodes: p.barcodes ?? null,
    })

    // Expected shape per user: { data: [...], size, success, totalPages, currentPage, totalElements }
    const dataArray = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : []
    const products = dataArray.map(mapProduct)

    return {
      products,
      pagination: {
        current_page: (result?.currentPage ?? apiPage) + 1,
        total_pages: result?.totalPages ?? 1,
        total_items: result?.totalElements ?? products.length,
        items_per_page: result?.size ?? limit,
      },
    }
  }

  static async getCategories(): Promise<ProductCategory[]> {
    const res = await fetch(`${API_BASE_URL}/categories`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status} ${res.statusText}`)
    const result = await res.json()
    if (Array.isArray(result?.data)) return result.data
    if (Array.isArray(result)) return result
    return []
  }

  // Units (Đơn vị tính)
  static async getUnits(): Promise<Array<{ id: number; name: string; description?: string; isDefault?: boolean }>> {
    const res = await fetch(`${API_BASE_URL}/uoms`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to fetch units: ${res.status} ${res.statusText}`)
    const result = await res.json()
    const arr = Array.isArray(result?.data) ? result.data : (Array.isArray(result) ? result : [])
    return arr.map((u: any) => ({ id: u.id, name: u.name ?? u.unitName ?? u.code ?? String(u.id), description: u.description, isDefault: (u.isDefault ?? u.is_default) ? true : false }))
  }

  static async createUnit(payload: { name: string; description?: string; isDefault?: boolean }): Promise<{ id: number; name: string; description?: string; createdAt?: string; isDefault?: boolean }> {
    const res = await fetch(`${API_BASE_URL}/uoms`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        name: payload.name,
        description: payload.description,
        // Gửi cả hai key để tương thích các BE khác nhau
        isDefault: payload.isDefault ? true : false,
        is_default: payload.isDefault ? 1 : 0,
      }),
    })
    if (!res.ok) throw new Error(`Failed to create unit: ${res.status} ${res.statusText}`)
    const result = await res.json()
    return result.data ?? result
  }

  static async updateUnit(id: number, payload: { name: string; description?: string; isDefault?: boolean }): Promise<{ id: number; name: string; description?: string; createdAt?: string; isDefault?: boolean }> {
    const res = await fetch(`${API_BASE_URL}/uoms/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        name: payload.name,
        description: payload.description,
        ...(payload.isDefault === undefined ? {} : { isDefault: !!payload.isDefault, is_default: payload.isDefault ? 1 : 0 }),
      }),
    })
    if (!res.ok) throw new Error(`Failed to update unit: ${res.status} ${res.statusText}`)
    const result = await res.json()
    return result.data ?? result
  }

  static async deleteUnit(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/uoms/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to delete unit: ${res.status} ${res.statusText}`)
  }

  // Upload product image (multipart/form-data), return image URL
  static async uploadProductImage(file: File): Promise<string> {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${API_BASE_URL}/products/image`, {
      method: 'POST',
      headers: (() => {
        const headers: Record<string, string> = {}
        const token = localStorage.getItem('access_token')
        if (token) headers['Authorization'] = `Bearer ${token}`
        return headers
      })(),
      body: form,
    })
    if (!res.ok) throw new Error(`Failed to upload image: ${res.status} ${res.statusText}`)
    const result = await res.json().catch(() => null)
    // Accept common shapes {url}, {data: {url}}, or plain string
    const url = result?.data?.url || result?.url || result
    if (!url || typeof url !== 'string') throw new Error('Upload did not return an image URL')
    return url
  }

  static async getProductById(id: number): Promise<Product> {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to fetch product: ${res.status} ${res.statusText}`)
    const result = await res.json()
    return result.data ?? result
  }

  // Get product by product code (maSP)
  static async getProductByProductCode(code: string): Promise<Product | null> {
    const res = await fetch(`${API_BASE_URL}/products/by-product-code/${encodeURIComponent(code)}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })
    if (!res.ok) return null
    const result = await res.json().catch(() => null)
    const data = (result?.data ?? result)
    if (!data) return null
    // Map minimal fields used on FE
    const mapUnit = (u: any): ProductUnit => ({
      id: u.id,
      unitId: u.unitId,
      unitName: u.unitName,
      conversionFactor: u.conversionFactor ?? u.conversionRate ?? 1,
      isDefault: !!u.isDefault,
      code: u.code,
      currentPrice: typeof u.currentPrice === 'number' ? u.currentPrice : undefined,
      convertedPrice: typeof u.convertedPrice === 'number' ? u.convertedPrice : undefined,
      quantity: typeof u.quantity === 'number' ? u.quantity : undefined,
      availableQuantity: typeof u.availableQuantity === 'number' ? u.availableQuantity : undefined,
    })
    const prod: Product = {
      id: data.id,
      name: data.name,
      code: data.code,
      description: data.description ?? '',
      imageUrl: this.toAbsoluteUrl(data.imageUrl ?? data.image_url) ?? null,
      expirationDate: data.expirationDate ?? null,
      categoryId: data.categoryId,
      categoryName: data.categoryName,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      active: data.active,
      defaultUnitId: data.defaultUnitId ?? null,
      productUnits: Array.isArray(data.productUnits) ? data.productUnits.map(mapUnit) : [],
      barcodes: data.barcodes ?? null,
    }
    return prod
  }

  // Get product by unit code (ma don vi san pham)
  static async getProductByUnitCode(code: string | number): Promise<Product | null> {
    const res = await fetch(`${API_BASE_URL}/products/by-unit-code/${encodeURIComponent(String(code))}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })
    if (!res.ok) return null
    const result = await res.json().catch(() => null)
    const data = (result?.data ?? result)
    if (!data) return null
    const mapUnit = (u: any): ProductUnit => ({
      id: u.id,
      unitId: u.unitId,
      unitName: u.unitName,
      conversionFactor: u.conversionFactor ?? u.conversionRate ?? 1,
      isDefault: !!u.isDefault,
      currentPrice: typeof u.currentPrice === 'number' ? u.currentPrice : undefined,
      convertedPrice: typeof u.convertedPrice === 'number' ? u.convertedPrice : undefined,
      quantity: typeof u.quantity === 'number' ? u.quantity : undefined,
      availableQuantity: typeof u.availableQuantity === 'number' ? u.availableQuantity : undefined,
    })
    const prod: Product = {
      id: data.id,
      name: data.name,
      code: data.code,
      description: data.description ?? '',
      imageUrl: this.toAbsoluteUrl(data.imageUrl ?? data.image_url) ?? null,
      expirationDate: data.expirationDate ?? null,
      categoryId: data.categoryId,
      categoryName: data.categoryName,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      active: data.active,
      defaultUnitId: data.defaultUnitId ?? null,
      productUnits: Array.isArray(data.productUnits) ? data.productUnits.map(mapUnit) : [],
      barcodes: data.barcodes ?? null,
    }
    return prod
  }



  static async createProduct(body: CreateProductRequest): Promise<Product> {
    const res = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      let errorMessage = text || `Failed to create product: ${res.status} ${res.statusText}`

      // Xử lý lỗi 400 - trùng mã/tên
      if (res.status === 400) {
        try {
          const errorData = JSON.parse(text)
          console.log('🔍 Backend error response:', errorData)
          if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch (parseError) {
          console.log('⚠️ Could not parse error response as JSON:', text)
          // Nếu không parse được JSON, sử dụng text gốc nếu có
          if (text && text.trim()) {
            errorMessage = text
          }
        }
      }

      const error = new Error(errorMessage) as any
      error.status = res.status
      throw error
    }
    const result = await res.json()
    return result.data ?? result
  }

  // Tạo sản phẩm kèm ảnh (multipart/form-data)
  static async createProductWithImage(fields: CreateProductRequest, imageFile: File): Promise<Product> {
    const form = new FormData()
    // Đính kèm file với nhiều tên key phổ biến để BE nào cũng đọc được
    form.append('file', imageFile, imageFile.name)
    form.append('image', imageFile, imageFile.name)
    form.append('imageFile', imageFile, imageFile.name)
    form.append('multipartFile', imageFile, imageFile.name)
    form.append('upload', imageFile, imageFile.name)
    form.append('photo', imageFile, imageFile.name)
    // Provide flat fields for simple parsers
    form.append('name', fields.name)
    if (fields.code) form.append('code', fields.code)
    form.append('description', fields.description ?? '')
    if (fields.expirationDate) form.append('expirationDate', fields.expirationDate)
    form.append('categoryId', String(fields.categoryId))
    if (typeof fields.active === 'boolean') form.append('active', String(fields.active))
    if (fields.defaultUnitId !== undefined && fields.defaultUnitId !== null && fields.defaultUnitId !== 0) {
      form.append('defaultUnitId', String(fields.defaultUnitId))
    }
    // Also include a JSON blob for robust servers
    form.append('product', new Blob([JSON.stringify(fields)], { type: 'application/json' }))

    const res = await fetch(`${API_BASE_URL}/products/with-image`, {
      method: 'POST',
      headers: (() => {
        const headers: Record<string, string> = {}
        const token = localStorage.getItem('access_token')
        if (token) headers['Authorization'] = `Bearer ${token}`
        return headers
      })(),
      body: form,
    })
    // Một số BE có thể trả 400 dù đã tạo xong (do validation phía sau). Hãy đọc body để xác nhận.
    const text = await res.text().catch(() => '')
    let result: any = null
    try { result = text ? JSON.parse(text) : null } catch (_) { result = text }

    if (!res.ok) {
      // Xử lý lỗi 400 - trùng mã/tên
      let errorMessage = `Failed to create product with image: ${res.status} ${res.statusText}`
      if (res.status === 400) {
        try {
          const errorData = JSON.parse(text)
          console.log('🔍 Backend error response (with image):', errorData)
          if (errorData.message) {
            errorMessage = errorData.message
            // Nếu có thông báo lỗi cụ thể về trùng mã/tên, không chấp nhận thành công
            if (errorData.message.includes('already exists') || errorData.message.includes('đã tồn tại') ||
                errorData.message.includes('duplicate') || errorData.message.includes('trùng')) {
              const error = new Error(errorMessage) as any
              error.status = res.status
              throw error
            }
          }
        } catch (parseError) {
          console.log('⚠️ Could not parse error response as JSON (with image):', text)
          if (text && text.trim()) {
            errorMessage = text
            // Nếu text chứa thông báo lỗi về trùng, không chấp nhận thành công
            if (text.includes('already exists') || text.includes('đã tồn tại') ||
                text.includes('duplicate') || text.includes('trùng')) {
              const error = new Error(errorMessage) as any
              error.status = res.status
              throw error
            }
          }
        }
      }

      // Chỉ chấp nhận thành công nếu không có lỗi trùng mã/tên
      const maybe = (result && (result.data || result.product || result.created || result))
      const candidate = Array.isArray(maybe) ? maybe[0] : maybe
      if (candidate && (candidate.id || result?.success === true)) {
        return candidate.id ? candidate : (result.data || candidate)
      }

      const error = new Error(errorMessage) as any
      error.status = res.status
      throw error
    }

    const data = (result && (result.data ?? result))
    if (data) {
      const rawUrl = data.imageUrl || data.image_url || data.url || data.path || data.imagePath
      if (rawUrl) data.imageUrl = ProductService.toAbsoluteUrl(rawUrl)
    }
    return data
  }

  static async updateProduct(id: number, body: UpdateProductRequest): Promise<Product> {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      let errorMessage = text || `Failed to update product: ${res.status} ${res.statusText}`

      // Xử lý lỗi 400 - trùng mã/tên
      if (res.status === 400) {
        try {
          const errorData = JSON.parse(text)
          console.log('🔍 Backend error response (update):', errorData)
          if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch (parseError) {
          console.log('⚠️ Could not parse error response as JSON (update):', text)
          if (text && text.trim()) {
            errorMessage = text
          }
        }
      }

      const error = new Error(errorMessage) as any
      error.status = res.status
      throw error
    }
    const result = await res.json()
    return result.data ?? result
  }

  // Update product (fields + optional image) via multipart PUT /products/{id}/with-image
  static async updateProductWithImage(id: number, fields: UpdateProductRequest, imageFile?: File | null): Promise<Product> {
    const form = new FormData()
    if (imageFile) {
      form.append('image', imageFile, imageFile.name)
      form.append('file', imageFile, imageFile.name)
    }
    form.append('name', fields.name)
    form.append('description', fields.description ?? '')
    if (fields.expirationDate) form.append('expirationDate', fields.expirationDate)
    form.append('categoryId', String(fields.categoryId))
    // Theo spec: chỉ name, description, categoryId; expirationDate optional; image optional

    const res = await fetch(`${API_BASE_URL}/products/${id}/with-image`, {
      method: 'PUT',
      headers: (() => {
        const headers: Record<string, string> = {}
        const token = localStorage.getItem('access_token')
        if (token) headers['Authorization'] = `Bearer ${token}`
        return headers
      })(),
      body: form,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      let errorMessage = text || `Failed to update product with image: ${res.status} ${res.statusText}`

      // Xử lý lỗi 400 - trùng mã/tên
      if (res.status === 400) {
        try {
          const errorData = JSON.parse(text)
          console.log('🔍 Backend error response (update with image):', errorData)
          if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch (parseError) {
          console.log('⚠️ Could not parse error response as JSON (update with image):', text)
          if (text && text.trim()) {
            errorMessage = text
          }
        }
      }

      const error = new Error(errorMessage) as any
      error.status = res.status
      throw error
    }
    const result = await res.json().catch(() => ({}))
    return result.data ?? result
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
      body: JSON.stringify({
        unitId: payload.unitId,
        conversionFactor: payload.conversionFactor,
        conversionRate: payload.conversionFactor, // BE may expect conversionRate
        isDefault: payload.isDefault,
      }),
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

  // Some BE versions expect productUnitId path for make-default
  static async makeDefaultByProductUnitId(productUnitId: number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/products/units/${productUnitId}/make-default`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to make default unit: ${res.status} ${res.statusText}`)
    const result = await res.json().catch(() => ({}))
    return result.data ?? result
  }

  // Update product unit properties (e.g., conversionFactor)
  static async updateProductUnit(productId: number, unitId: number, payload: { conversionFactor?: number; isDefault?: boolean }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/products/${productId}/units/${unitId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        ...payload,
        conversionRate: payload.conversionFactor ?? undefined,
      }),
    })
    if (!res.ok) throw new Error(`Failed to update product unit: ${res.status} ${res.statusText}`)
    const result = await res.json().catch(() => ({}))
    return result.data ?? result
  }

  // Update by productUnitId path (some BE uses this route)
  static async updateProductUnitByProductUnitId(productUnitId: number, payload: { conversionFactor?: number; isDefault?: boolean }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/products/units/${productUnitId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        ...payload,
        conversionRate: payload.conversionFactor ?? undefined,
      }),
    })
    if (!res.ok) throw new Error(`Failed to update product unit: ${res.status} ${res.statusText}`)
    const result = await res.json().catch(() => ({}))
    return result.data ?? result
  }

  // Update code (MaSP) for a product unit
  static async updateProductUnitCode(productUnitId: number, code: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/products/units/${productUnitId}/code`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ code })
    })
    if (!res.ok) throw new Error(`Failed to update unit code: ${res.status} ${res.statusText}`)
    const result = await res.json().catch(() => ({}))
    return result.data ?? result
  }

  // Delete product unit by productUnitId (cleanup auto-created base unit)
  static async deleteProductUnitById(productUnitId: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/products/units/${productUnitId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to delete product unit: ${res.status} ${res.statusText}`)
  }

  // Delete product unit using backend-supported route with productId
  static async deleteProductUnit(productId: number, productUnitId: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/products/${productId}/units/${productUnitId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to delete product unit: ${res.status} ${res.statusText}`)
  }

  // Deactivate product unit
  static async deactivateProductUnit(productId: number, productUnitId: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/products/${productId}/units/${productUnitId}/deactivate`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to deactivate product unit: ${res.status} ${res.statusText}`)
  }

  // Activate product unit
  static async activateProductUnit(productId: number, productUnitId: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/products/${productId}/units/${productUnitId}/activate`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to activate product unit: ${res.status} ${res.statusText}`)
  }

  // Deactivate product
  static async deactivateProduct(productId: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ active: false })
    })
    if (!res.ok) throw new Error(`Failed to deactivate product: ${res.status} ${res.statusText}`)
  }

  // Activate product
  static async activateProduct(productId: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ active: true })
    })
    if (!res.ok) throw new Error(`Failed to activate product: ${res.status} ${res.statusText}`)
  }

  // PRICE APIs
  // Global price headers
  static async listPriceHeaders(): Promise<Array<{ id: number; name: string; description?: string; timeStart?: string; timeEnd?: string; active?: boolean; createdAt?: string }>> {
    const res = await fetch(`${API_BASE_URL}/products/price-headers`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to fetch price headers: ${res.status} ${res.statusText}`)
    const result = await res.json().catch(() => [])
    return (Array.isArray(result?.data) ? result.data : result) || []
  }

  // Get price header detail by ID (header info and possibly lines)
  static async getPriceHeaderById(id: number): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/products/price-headers/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to fetch price header: ${res.status} ${res.statusText}`)
    const result = await res.json().catch(() => ({}))
    return result?.data ?? result
  }

  static async createGlobalPriceHeader(payload: { name: string; description?: string; timeStart?: string | null; timeEnd?: string | null; active?: boolean }): Promise<{ id: number; name: string }> {
    // Remove null/undefined fields
    const clean: Record<string, any> = { name: payload.name }
    if (payload.description) clean.description = payload.description
    if (payload.timeStart) clean.timeStart = payload.timeStart
    if (payload.timeEnd) clean.timeEnd = payload.timeEnd
    if (payload.active !== undefined) clean.active = payload.active

    const res = await fetch(`${API_BASE_URL}/products/price-headers`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(clean),
    })
    if (!res.ok) throw new Error(`Failed to create price header: ${res.status} ${res.statusText}`)
    const result = await res.json().catch(() => ({}))
    return result.data ?? result
  }

  static async bulkAddPricesToHeader(priceHeaderId: number, items: Array<{ productUnitId: number; price: number; productCode?: string }>): Promise<any[]> {
    const url = `${API_BASE_URL}/products/price-headers/${priceHeaderId}/prices/bulk`

    // Attempt 1: array body with { productUnitId, price } (as in your Postman)
    let res = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(items.map(it => ({ productUnitId: it.productUnitId, price: it.price }))),
    })
    if (res.ok) {
      const result = await res.json().catch(() => ([]))
      return result.data ?? result
    }

    // Xử lý lỗi 400 - sản phẩm đã có giá trong header
    if (res.status === 400) {
      const text = await res.text().catch(() => '')
      let errorMessage = text || `Failed to bulk add prices: ${res.status} ${res.statusText}`

      try {
        const errorData = JSON.parse(text)
        console.log('🔍 Backend error response (bulk add prices):', errorData)
        if (errorData.message) {
          errorMessage = errorData.message
        }
      } catch (parseError) {
        console.log('⚠️ Could not parse error response as JSON (bulk add prices):', text)
        if (text && text.trim()) {
          errorMessage = text
        }
      }

      const error = new Error(errorMessage) as any
      error.status = res.status
      throw error
    }

    // Attempt 2: wrapped payload with items [{ productCode, unitId, price }] for other BE versions
    const wrapped = { items: items.map(it => ({ productCode: it.productCode, unitId: it.productUnitId, price: it.price })) }
    res = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(wrapped),
    })
    if (!res.ok) {
      // Xử lý lỗi 400 cho attempt 2
      if (res.status === 400) {
        const text = await res.text().catch(() => '')
        let errorMessage = text || `Failed to bulk add prices: ${res.status} ${res.statusText}`

        try {
          const errorData = JSON.parse(text)
          console.log('🔍 Backend error response (bulk add prices attempt 2):', errorData)
          if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch (parseError) {
          console.log('⚠️ Could not parse error response as JSON (bulk add prices attempt 2):', text)
          if (text && text.trim()) {
            errorMessage = text
          }
        }

        const error = new Error(errorMessage) as any
        error.status = res.status
        throw error
      }

      throw new Error(`Failed to bulk add prices: ${res.status} ${res.statusText}`)
    }
    const result2 = await res.json().catch(() => ([]))
    return result2.data ?? result2
  }

  // Activate price header
  static async activatePriceHeader(priceHeaderId: number): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/products/price-headers/${priceHeaderId}/activate`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      })
      if (!res.ok) throw new Error(`Failed to activate price header: ${res.status} ${res.statusText}`)
      const result = await res.json()
      return result.data ?? result
    } catch (error) {
      console.error('Error activating price header:', error)
      throw error
    }
  }

  // Deactivate price header
  static async deactivatePriceHeader(priceHeaderId: number): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/products/price-headers/${priceHeaderId}/deactivate`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      })
      if (!res.ok) throw new Error(`Failed to deactivate price header: ${res.status} ${res.statusText}`)
      const result = await res.json()
      return result.data ?? result
    } catch (error) {
      console.error('Error deactivating price header:', error)
      throw error
    }
  }

  // Check products in price header
  static async checkProductsInHeader(priceHeaderId: number): Promise<{
    headerName: string;
    productsInHeader: Array<{
      productCode: string | null;
      productId: number;
      productName: string;
      units: Array<{
        productUnitId: number;
        unitName: string;
        price: number;
        createdAt: string;
      }>;
      totalUnits: number;
    }>;
    totalProducts: number;
    totalPrices: number;
    headerId: number;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/products/price-headers/${priceHeaderId}/check-products`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })
      if (!res.ok) throw new Error(`Failed to check products: ${res.status} ${res.statusText}`)
      const result = await res.json()
      return result.data
    } catch (error) {
      console.error('Error checking products in header:', error)
      throw error
    }
  }

  // Check time conflict for product unit in price header
  static async checkTimeConflict(productUnitId: number, priceHeaderId: number): Promise<{
    hasConflict: boolean;
    message?: string;
    conflictingHeaders?: Array<{
      headerId: number;
      headerName: string;
      timeStart: string;
      timeEnd?: string;
    }>;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/products/check-time-conflict?productUnitId=${productUnitId}&priceHeaderId=${priceHeaderId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })
      if (!res.ok) throw new Error(`Failed to check time conflict: ${res.status} ${res.statusText}`)
      const result = await res.json()
      return result.data || result
    } catch (error) {
      console.error('Error checking time conflict:', error)
      throw error
    }
  }

  // Get prices by price header ID
  static async getPricesByHeader(priceHeaderId: number): Promise<Array<{
    id: number;
    productId: number;
    productName: string;
    productUnitId: number;
    unitName: string;
    productCode?: string;
    price: number;
    timeStart?: string;
    timeEnd?: string;
    createdAt?: string;
  }>> {
    try {
      // Try different possible endpoint structures
      let res = await fetch(`${API_BASE_URL}/price-headers/${priceHeaderId}/prices`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      if (!res.ok) {
        // Try alternative endpoint
        res = await fetch(`${API_BASE_URL}/prices/header/${priceHeaderId}`, {
          method: 'GET',
          headers: this.getAuthHeaders(),
        })
      }

      if (!res.ok) {
        // Try another alternative
        res = await fetch(`${API_BASE_URL}/products/price-headers/${priceHeaderId}/prices`, {
          method: 'GET',
          headers: this.getAuthHeaders(),
        })
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch prices by header: ${res.status} ${res.statusText}`)
      }

      const result = await res.json()
      return (Array.isArray(result?.data) ? result.data : result) || []
    } catch (error) {
      console.error('Error fetching prices by header:', error)
      // Return empty array as fallback
      return []
    }
  }
  static async getProductPrices(productId: number): Promise<Array<{ id: number; unitId: number; unitName?: string; price: number; isDefault?: boolean; validFrom?: string; validTo?: string }>> {
    const res = await fetch(`${API_BASE_URL}/products/${productId}/prices`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to fetch prices: ${res.status} ${res.statusText}`)
    const result = await res.json()
    return (Array.isArray(result?.data) ? result.data : result) || []
  }

  // Unit-specific price history
  static async getUnitPriceHistory(productId: number, productUnitId: number): Promise<Array<{ id: number; productUnitId: number; unitId?: number; unitName?: string; price: number; priceHeaderId?: number; timeStart?: string; timeEnd?: string; createdAt?: string }>> {
    const res = await fetch(`${API_BASE_URL}/products/${productId}/prices/units/${productUnitId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to fetch unit price history: ${res.status} ${res.statusText}`)
    const result = await res.json()
    const arr = Array.isArray(result?.data) ? result.data : (Array.isArray(result) ? result : [])
    return arr
  }

  static async addProductPrice(productId: number, payload: { unitId: number; price: number; validFrom?: string; validTo?: string }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/products/${productId}/prices`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        productUnitId: payload.unitId,
        price: payload.price,
        ...(payload.validFrom ? { timeStart: payload.validFrom } : {}),
        ...(payload.validTo ? { timeEnd: payload.validTo } : {}),
      }),
    })
    if (!res.ok) throw new Error(`Failed to add price: ${res.status} ${res.statusText}`)
    const result = await res.json()
    return result.data ?? result
  }

  // Add price for a unit with header (preferred)
  static async addUnitPriceWithHeader(productId: number, productUnitId: number, payload: { priceHeaderId: number; price: number; timeStart: string; timeEnd?: string }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/products/${productId}/prices/units/${productUnitId}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`Failed to add unit price: ${res.status} ${res.statusText}`)
    const result = await res.json()
    return result.data ?? result
  }

  // Fallback: add price under price header path if BE requires it
  static async addPriceUnderHeader(productId: number, priceHeaderId: number, payload: { price: number; timeStart?: string; timeEnd?: string }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/products/${productId}/price-headers/${priceHeaderId}/prices`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        price: payload.price,
        timeStart: payload.timeStart,
        timeEnd: payload.timeEnd,
      }),
    })
    if (!res.ok) throw new Error(`Failed to add price (header path): ${res.status} ${res.statusText}`)
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


  static async createPriceHeader(productId: number, productUnitId: number, payload: { name: string; description?: string | null; timeStart?: string | null; timeEnd?: string | null; active?: boolean }): Promise<{ id: number; name: string }> {
    const url = `${API_BASE_URL}/products/${productId}/price-headers/units/${productUnitId}`

    // Loại bỏ các trường null/undefined trước khi gửi
    const cleanPayload = { ...payload }
    if (cleanPayload.description === null || cleanPayload.description === undefined) {
      delete cleanPayload.description
    }
    if (cleanPayload.timeStart === null || cleanPayload.timeStart === undefined) {
      delete cleanPayload.timeStart
    }
    if (cleanPayload.timeEnd === null || cleanPayload.timeEnd === undefined) {
      delete cleanPayload.timeEnd
    }

    console.log('🌐 API Call - Create Price Header:', {
      url,
      payload: cleanPayload,
      headers: this.getAuthHeaders()
    })

    const res = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(cleanPayload),
    })

    console.log('📡 Price Header API Response:', {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('❌ Price Header API Error Response:', errorText)
      throw new Error(`Failed to create price header: ${res.status} ${res.statusText} - ${errorText}`)
    }

    const result = await res.json()
    console.log('✅ Price Header API Success Response:', result)
    return result.data ?? result
  }

  // Get current price for a product unit
  static async getCurrentPrice(productId: number, productUnitId: number): Promise<number | null> {
    const res = await fetch(`${API_BASE_URL}/products/${productId}/prices/current?productUnitId=${productUnitId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })
    if (!res.ok) return null
    const result = await res.json().catch(() => null)
    const value = (result?.data ?? result)
    return typeof value === 'number' ? value : null
  }

  // Add price for product unit using the correct API endpoint
  static async addPriceForProductUnit(
    productId: number,
    productUnitId: number,
    payload: {
      productUnitId: number;
      price: number;
      timeStart?: string | null;
      timeEnd?: string | null;
      priceHeaderId?: number;
      active?: boolean
    }
  ): Promise<any> {
    const url = `${API_BASE_URL}/products/${productId}/prices/units/${productUnitId}`

    // Loại bỏ các trường null/undefined trước khi gửi
    const cleanPayload = { ...payload }

    // timeStart là bắt buộc, không được xóa
    if (cleanPayload.timeStart === null || cleanPayload.timeStart === undefined || cleanPayload.timeStart === '') {
      throw new Error('timeStart is required for adding price')
    }

    // Chỉ xóa timeEnd nếu null/undefined
    if (cleanPayload.timeEnd === null || cleanPayload.timeEnd === undefined || cleanPayload.timeEnd === '') {
      delete cleanPayload.timeEnd
    }

    console.log('🌐 API Call - Add Price:', {
      url,
      payload: cleanPayload,
      headers: this.getAuthHeaders()
    })

    const res = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(cleanPayload),
    })

    console.log('📡 API Response:', {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('❌ API Error Response:', errorText)
      throw new Error(`Failed to add price for product unit: ${res.status} ${res.statusText} - ${errorText}`)
    }

    const result = await res.json()
    console.log('✅ API Success Response:', result)
    return result.data ?? result
  }
}
