import { api } from './api'

export interface CreateReturnDetailRequest {
  orderDetailId: number
  quantity: number
}

export interface CreateReturnRequest {
  orderId: number
  reason: string
  returnDetails: CreateReturnDetailRequest[]
}

export interface ReturnOrderResponse {
  id: number
  orderId: number
  returnCode?: string
  orderCode?: string
  customerId: number
  customerName: string
  customerPhone: string
  customerEmail: string
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  reason: string
  adminNote?: string
  totalRefundAmount: number
  createdAt: string
  processedAt?: string
  returnDetails: ReturnDetailResponse[]
  canApprove: boolean
  canReject: boolean
  canComplete: boolean
}

export interface ReturnDetailResponse {
  id: number
  returnOrderId: number
  orderDetailId: number
  productUnitId: number
  productName: string
  unitName: string
  productImageUrl: string
  quantity: number
  unitPrice: number
  refundAmount: number
  originalQuantity: number
  maxReturnQuantity: number
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
}

export class ReturnOrderService {
  // Tạo đơn trả hàng
  static async createReturnOrder(request: CreateReturnRequest): Promise<ApiResponse<ReturnOrderResponse>> {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('user_access_token')
      const response = await api.post('/returns', request, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return response.data as ApiResponse<any>
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tạo đơn trả hàng')
    }
  }

  // Hoàn thành trả hàng (tự động approve và complete)
  static async completeReturnOrder(returnId: number): Promise<ApiResponse<any>> {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('user_access_token')
      const response = await api.put(`/returns/${returnId}/complete`, undefined, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return response.data as ApiResponse<any>
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể hoàn thành trả hàng')
    }
  }

  // Lấy danh sách đơn trả hàng
  static async getReturnOrders(params?: {
    page?: number
    size?: number
    customerId?: number
    status?: string
  }): Promise<ApiResponse<{
    data: any[]
    totalElements: number
    totalPages: number
    currentPage: number
    size: number
  }>> {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('user_access_token')
      const queryString = params ? '?' + new URLSearchParams(params as any).toString() : ''
      const response = await api.get(`/returns${queryString}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return response.data as ApiResponse<any>
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể lấy danh sách đơn trả hàng')
    }
  }

  // Lấy danh sách đơn hàng đã hoàn trả (COMPLETED)
  static async getCompletedReturns(params?: {
    page?: number
    size?: number
  }): Promise<ApiResponse<{
    data: ReturnOrderResponse[]
    totalElements: number
    totalPages: number
    currentPage: number
    size: number
  }>> {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('user_access_token')
      const queryParams = {
        status: 'COMPLETED',
        page: params?.page || 0,
        size: params?.size || 10,
        ...params
      }
      const queryString = '?' + new URLSearchParams(queryParams as any).toString()
      const response = await api.get(`/returns${queryString}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return response.data as ApiResponse<any>
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể lấy danh sách đơn hàng đã hoàn trả')
    }
  }

  // Lấy chi tiết đơn trả hàng
  static async getReturnOrderById(returnId: number): Promise<ApiResponse<ReturnOrderResponse>> {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('user_access_token')
      const response = await api.get(`/returns/${returnId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return response.data as ApiResponse<any>
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể lấy chi tiết đơn trả hàng')
    }
  }

  // Duyệt đơn trả hàng
  static async approveReturnOrder(returnId: number): Promise<ApiResponse<any>> {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('user_access_token')
      const response = await api.put(`/returns/${returnId}/approve`, undefined, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return response.data as ApiResponse<any>
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể duyệt đơn trả hàng')
    }
  }

  // Từ chối đơn trả hàng
  static async rejectReturnOrder(returnId: number): Promise<ApiResponse<any>> {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('user_access_token')
      const response = await api.put(`/returns/${returnId}/reject`, undefined, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return response.data as ApiResponse<any>
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể từ chối đơn trả hàng')
    }
  }

  // Lấy danh sách sản phẩm trong đơn trả hàng
  static async getReturnDetails(returnId: number): Promise<ApiResponse<ReturnDetailResponse[]>> {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('user_access_token')
      const response = await api.get(`/returns/${returnId}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return response.data as ApiResponse<any>
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể lấy danh sách sản phẩm trả hàng')
    }
  }
}

export default ReturnOrderService
