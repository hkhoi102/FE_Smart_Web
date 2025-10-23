const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
import { ProductService, Product, ProductUnit } from '@/services/productService'

function authHeaders(): HeadersInit {
  // Try user token first, fallback to admin token
  const userToken = localStorage.getItem('user_access_token')
  const adminToken = localStorage.getItem('access_token')
  const token = userToken || adminToken

  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  }
}

export interface ProductAnalytics {
  productUnitId: number
  quantity: number
  revenue: number
  categoryId: number
  // Các trường bổ sung sẽ được fetch từ API khác
  productName?: string
  productCode?: string
  categoryName?: string
  averagePrice?: number
}

export interface ProductAnalyticsResponse {
  success: boolean
  data: number[][] // Mảng 2 chiều: [productUnitId, quantity, revenue, categoryId]
  endDate: string
  limit: number
  sortBy: string
  startDate: string
}

class ProductStatsService {
  // Lấy thông tin sản phẩm theo productUnitId
  private async getProductInfo(productUnitId: number): Promise<{ productName: string; unitName: string; categoryName: string }> {
    try {
      // Lấy tất cả sản phẩm để tìm productUnit
      const productsResponse = await ProductService.getProducts(1, 1000)
      const products = productsResponse.products

      // Tìm productUnit trong tất cả sản phẩm
      for (const product of products) {
        if (product.productUnits) {
          const productUnit = product.productUnits.find(unit => unit.id === productUnitId)
          if (productUnit) {
            return {
              productName: product.name,
              unitName: productUnit.unitName,
              categoryName: product.categoryName || `Danh mục ${product.categoryId}`
            }
          }
        }
      }

      // Nếu không tìm thấy, trả về thông tin mặc định
      return {
        productName: `Sản phẩm ${productUnitId}`,
        unitName: 'Đơn vị',
        categoryName: 'Danh mục'
      }
    } catch (error) {
      console.error('Error fetching product info:', error)
      return {
        productName: `Sản phẩm ${productUnitId}`,
        unitName: 'Đơn vị',
        categoryName: 'Danh mục'
      }
    }
  }
  // Lấy sản phẩm bán chạy nhất
  async getBestSellingProducts(
    startDate: string,
    endDate: string,
    sortBy: 'quantity' | 'revenue' = 'quantity',
    limit: number = 10
  ): Promise<ProductAnalytics[]> {
    try {
      const queryParams = new URLSearchParams({
        startDate,
        endDate,
        sortBy,
        limit: limit.toString()
      })

      const response = await fetch(`${API_BASE_URL}/orders/analytics/products/best-selling?${queryParams}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const responseData = await response.json()
      console.log('Best selling API response:', responseData)

      // Chuyển đổi mảng 2 chiều thành object và lấy thông tin sản phẩm
      const products: ProductAnalytics[] = []

      for (const item of responseData.data || []) {
        const productInfo = await this.getProductInfo(item[0])
        products.push({
          productUnitId: item[0],
          quantity: item[1],
          revenue: item[2],
          categoryId: item[3],
          productName: productInfo.productName,
          categoryName: productInfo.categoryName,
          averagePrice: item[1] > 0 ? item[2] / item[1] : 0
        })
      }

      return products
    } catch (error) {
      console.error('Error fetching best selling products:', error)
      throw error
    }
  }

  // Lấy sản phẩm bán chậm nhất
  async getWorstSellingProducts(
    startDate: string,
    endDate: string,
    sortBy: 'quantity' | 'revenue' = 'quantity',
    limit: number = 10
  ): Promise<ProductAnalytics[]> {
    try {
      const queryParams = new URLSearchParams({
        startDate,
        endDate,
        sortBy,
        limit: limit.toString()
      })

      const response = await fetch(`${API_BASE_URL}/orders/analytics/products/worst-selling?${queryParams}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const responseData = await response.json()
      console.log('Worst selling API response:', responseData)

      // Chuyển đổi mảng 2 chiều thành object và lấy thông tin sản phẩm
      const products: ProductAnalytics[] = []

      for (const item of responseData.data || []) {
        const productInfo = await this.getProductInfo(item[0])
        products.push({
          productUnitId: item[0],
          quantity: item[1],
          revenue: item[2],
          categoryId: item[3],
          productName: productInfo.productName,
          categoryName: productInfo.categoryName,
          averagePrice: item[1] > 0 ? item[2] / item[1] : 0
        })
      }

      return products
    } catch (error) {
      console.error('Error fetching worst selling products:', error)
      throw error
    }
  }

  // Lấy sản phẩm bán chạy nhất theo doanh thu (API riêng)
  async getBestSellingProductsByRevenue(
    startDate: string,
    endDate: string,
    limit: number = 10
  ): Promise<ProductAnalytics[]> {
    try {
      const queryParams = new URLSearchParams({
        startDate,
        endDate,
        sortBy: 'revenue',
        limit: limit.toString()
      })

      const response = await fetch(`${API_BASE_URL}/orders/analytics/products/best-selling?${queryParams}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const responseData = await response.json()
      console.log('Best selling by revenue API response:', responseData)

      // Chuyển đổi mảng 2 chiều thành object và lấy thông tin sản phẩm
      const products: ProductAnalytics[] = []

      for (const item of responseData.data || []) {
        const productInfo = await this.getProductInfo(item[0])
        products.push({
          productUnitId: item[0],
          quantity: item[1],
          revenue: item[2],
          categoryId: item[3],
          productName: productInfo.productName,
          categoryName: productInfo.categoryName,
          averagePrice: item[1] > 0 ? item[2] / item[1] : 0
        })
      }

      return products
    } catch (error) {
      console.error('Error fetching best selling products by revenue:', error)
      throw error
    }
  }

  // Lấy sản phẩm bán chậm nhất theo doanh thu (API riêng)
  async getWorstSellingProductsByRevenue(
    startDate: string,
    endDate: string,
    limit: number = 10
  ): Promise<ProductAnalytics[]> {
    try {
      const queryParams = new URLSearchParams({
        startDate,
        endDate,
        sortBy: 'revenue',
        limit: limit.toString()
      })

      const response = await fetch(`${API_BASE_URL}/orders/analytics/products/worst-selling?${queryParams}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const responseData = await response.json()
      console.log('Worst selling by revenue API response:', responseData)

      // Chuyển đổi mảng 2 chiều thành object và lấy thông tin sản phẩm
      const products: ProductAnalytics[] = []

      for (const item of responseData.data || []) {
        const productInfo = await this.getProductInfo(item[0])
        products.push({
          productUnitId: item[0],
          quantity: item[1],
          revenue: item[2],
          categoryId: item[3],
          productName: productInfo.productName,
          categoryName: productInfo.categoryName,
          averagePrice: item[1] > 0 ? item[2] / item[1] : 0
        })
      }

      return products
    } catch (error) {
      console.error('Error fetching worst selling products by revenue:', error)
      throw error
    }
  }
}

export const productStatsService = new ProductStatsService()
