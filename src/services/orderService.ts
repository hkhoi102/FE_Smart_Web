const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token')
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
}


