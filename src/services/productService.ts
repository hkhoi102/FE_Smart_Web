import { Product, ProductResponse, PaginationInfo } from '@/types/product'
import { mockProducts, categories } from '@/data/mockProducts'

export class ProductService {
  private static products = mockProducts
  private static categories = categories

  // Lấy danh sách sản phẩm với phân trang
  static async getProducts(
    page: number = 1,
    limit: number = 10,
    search?: string,
    categoryId?: number
  ): Promise<ProductResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    let filteredProducts = [...this.products]

    // Filter by search
    if (search) {
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.description.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Filter by category
    if (categoryId) {
      filteredProducts = filteredProducts.filter(product => product.category_id === categoryId)
    }

    // Calculate pagination
    const totalItems = filteredProducts.length
    const totalPages = Math.ceil(totalItems / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit

    const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

    const pagination: PaginationInfo = {
      current_page: page,
      total_pages: totalPages,
      total_items: totalItems,
      items_per_page: limit
    }

    return {
      products: paginatedProducts,
      pagination
    }
  }

  // Lấy thông tin sản phẩm theo ID
  static async getProductById(id: number): Promise<Product | null> {
    await new Promise(resolve => setTimeout(resolve, 300))
    return this.products.find(product => product.id === id) || null
  }

  // Lấy danh sách categories
  static async getCategories() {
    await new Promise(resolve => setTimeout(resolve, 200))
    return this.categories
  }

  // Tạo sản phẩm mới
  static async createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const newProduct: Product = {
      ...productData,
      id: Math.max(...this.products.map(p => p.id)) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    this.products.unshift(newProduct)
    return newProduct
  }

  // Cập nhật sản phẩm
  static async updateProduct(id: number, productData: Partial<Product>): Promise<Product | null> {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const index = this.products.findIndex(product => product.id === id)
    if (index === -1) return null
    
    this.products[index] = {
      ...this.products[index],
      ...productData,
      updated_at: new Date().toISOString()
    }
    
    return this.products[index]
  }

  // Xóa sản phẩm
  static async deleteProduct(id: number): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const index = this.products.findIndex(product => product.id === id)
    if (index === -1) return false
    
    this.products.splice(index, 1)
    return true
  }

  // Toggle trạng thái active
  static async toggleProductStatus(id: number): Promise<Product | null> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const product = this.products.find(p => p.id === id)
    if (!product) return null
    
    product.active = product.active === 1 ? 0 : 1
    product.updated_at = new Date().toISOString()
    
    return product
  }
}
