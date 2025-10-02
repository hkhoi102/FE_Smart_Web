const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

function authHeaders(): HeadersInit {
  // Try user token first, fallback to admin token
  const userToken = localStorage.getItem('user_access_token')
  const adminToken = localStorage.getItem('access_token')
  const token = userToken || adminToken

  console.log('🔑 Auth Headers Debug:', {
    userToken: userToken ? `${userToken.substring(0, 20)}...` : 'null',
    adminToken: adminToken ? `${adminToken.substring(0, 20)}...` : 'null',
    selectedToken: token ? `${token.substring(0, 20)}...` : 'null'
  })

  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  }
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED'

export interface OrderSummaryDto {
  id: number
  customerId: number
  totalAmount: number
  status: OrderStatus
  createdAt: string
  canCancel?: boolean
  itemCount?: number
}

export interface OrderDetailLineDto {
  id: number
  orderId: number
  productUnitId: number
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface OrderResponseDto {
  id: number
  customerId: number
  totalAmount: number
  discountAmount?: number
  status: OrderStatus
  paymentMethod?: 'COD' | 'BANK_TRANSFER'
  paymentStatus?: 'PAID' | 'UNPAID'
  promotionAppliedId?: number
  createdAt: string
  updatedAt: string
  orderDetails?: OrderDetailLineDto[]
  canCancel?: boolean
  canReturn?: boolean
  paymentInfo?: any
}

export interface CreateOrderRequest {
  orderDetails: Array<{ productUnitId: number; quantity: number }>
  promotionAppliedId?: number
  paymentMethod?: 'COD' | 'BANK_TRANSFER'
  shippingAddress?: string
}

export interface CartReviewRequest {
  orderDetails: Array<{ productUnitId: number; quantity: number }>
  promotionAppliedId?: number
}

export interface CartReviewResponse {
  subtotal: number
  discountAmount: number
  totalAmount: number
  appliedPromotion?: {
    id: number
    name: string
    type: string
    discountAmount: number
  }
  orderDetails: Array<{
    productUnitId: number
    productName: string
    unitName: string
    quantity: number
    unitPrice: number
    subtotal: number
  }>
}

export const OrderApi = {
  async list(params: { page?: number; size?: number; customerId?: number; status?: OrderStatus } = {}) {
    const sp = new URLSearchParams()
    if (params.page != null) sp.set('page', String(params.page))
    if (params.size != null) sp.set('size', String(params.size))
    if (params.customerId != null) sp.set('customerId', String(params.customerId))
    if (params.status) sp.set('status', params.status)
    const res = await fetch(`${API_BASE_URL}/orders?${sp.toString()}`, { headers: authHeaders() })
    if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`)
    return res.json()
  },

  async getById(id: number): Promise<{ success: boolean; data: OrderResponseDto }> {
    const res = await fetch(`${API_BASE_URL}/orders/${id}`, { headers: authHeaders() })
    if (!res.ok) throw new Error(`Failed to fetch order ${id}`)
    return res.json()
  },

  async updateStatus(id: number, status: OrderStatus, note?: string) {
    const res = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status, note }),
    })
    if (!res.ok) throw new Error(`Failed to update status for order ${id}`)
    return res.json()
  },

  async cancel(id: number) {
    const res = await fetch(`${API_BASE_URL}/orders/${id}`, { method: 'DELETE', headers: authHeaders() })
    if (!res.ok) throw new Error(`Failed to cancel order ${id}`)
    return res.json()
  },

  async getPaymentStatus(id: number) {
    const res = await fetch(`${API_BASE_URL}/orders/${id}/payment-status`, { headers: authHeaders() })
    if (!res.ok) throw new Error(`Failed to get payment status for order ${id}`)
    return res.json()
  },

  async updatePaymentStatus(id: number, paymentStatus: 'PAID' | 'UNPAID') {
    const res = await fetch(`${API_BASE_URL}/orders/${id}/payment-status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ paymentStatus })
    })
    if (!res.ok) throw new Error(`Failed to update payment status for order ${id}`)
    return res.json()
  },

  async reviewCart(request: CartReviewRequest): Promise<CartReviewResponse> {
    // API only needs orderDetails, not promotionAppliedId
    const apiRequest = {
      orderDetails: request.orderDetails
    }

    console.log('🌐 API Call - Review Cart:', {
      url: `${API_BASE_URL}/orders/preview`,
      method: 'POST',
      headers: authHeaders(),
      body: apiRequest
    })

    // Use the correct endpoint: /orders/preview
    const res = await fetch(`${API_BASE_URL}/orders/preview`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(apiRequest)
    })

    console.log('📡 API Response:', {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('❌ API Error Response:', errorText)

      // If API fails, return mock data for development
      if (res.status === 404 || res.status === 500) {
        console.log('🔄 Using mock data for cart review (API not available)')
        console.warn('⚠️ Backend API /orders/preview is not available, using mock data')

        // Calculate subtotal from cart items (using localStorage cart data)
        const cartItems = JSON.parse(localStorage.getItem('cart') || '{"items": []}').items || []
        const subtotal = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)

        const mockResponse: CartReviewResponse = {
          subtotal: subtotal,
          discountAmount: 0,
          totalAmount: subtotal,
          orderDetails: request.orderDetails.map(item => {
            const cartItem = cartItems.find((ci: any) => ci.unitId === item.productUnitId || ci.id === item.productUnitId)
            return {
              productUnitId: item.productUnitId,
              productName: cartItem?.name || `Product ${item.productUnitId}`,
              unitName: cartItem?.unitName || 'Unit',
              quantity: item.quantity,
              unitPrice: cartItem?.price || 0,
              subtotal: item.quantity * (cartItem?.price || 0)
            }
          })
        }

        return mockResponse
      }

      throw new Error(`Failed to review cart: ${res.status} - ${errorText}`)
    }

    const data = await res.json()
    console.log('✅ API Success Response:', data)

    // Map API response to CartReviewResponse format
    if (data.success && data.data) {
      const apiData = data.data
      return {
        subtotal: apiData.totalOriginalAmount || 0,
        discountAmount: apiData.totalDiscountAmount || 0,
        totalAmount: apiData.totalFinalAmount || 0,
        appliedPromotion: apiData.appliedPromotions && apiData.appliedPromotions.length > 0 ? {
          id: 1, // Mock ID since API doesn't return promotion ID
          name: apiData.appliedPromotions[0],
          type: 'DISCOUNT',
          discountAmount: apiData.totalDiscountAmount || 0
        } : undefined,
        orderDetails: request.orderDetails.map(item => ({
          productUnitId: item.productUnitId,
          productName: `Product ${item.productUnitId}`,
          unitName: 'Unit',
          quantity: item.quantity,
          unitPrice: 0, // API doesn't return individual prices
          subtotal: 0
        }))
      }
    }

    return data.data ?? data
  },

  async matchPaymentBySepay(content: string, amount: number, limit: number = 20): Promise<boolean> {
    const sp = new URLSearchParams({ content, amount: String(amount), limit: String(limit) })
    const res = await fetch(`${API_BASE_URL}/payments/sepay/match?${sp.toString()}`, { headers: authHeaders() })
    if (!res.ok) return false
    try {
      const data = await res.json()
      // Flexible handling of expected shapes
      if (typeof data === 'boolean') return data
      if (data?.success === true) return true
      if (data?.matched === true || data?.data?.matched === true) return true
      if (Array.isArray(data?.data)) return data.data.length > 0
      if (Array.isArray(data)) return data.length > 0
      return !!(data?.matched || data?.result === true)
    } catch {
      return false
    }
  },

  async createOrder(request: CreateOrderRequest): Promise<OrderResponseDto> {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(request)
    })
    if (!res.ok) throw new Error(`Failed to create order: ${res.status}`)
    const data = await res.json()
    return data.data ?? data
  },
}


