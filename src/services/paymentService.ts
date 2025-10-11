const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

function authHeaders(): HeadersInit {
  const userToken = localStorage.getItem('user_access_token')
  const adminToken = localStorage.getItem('access_token')
  const token = userToken || adminToken

  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  }
}

export interface CreatePaymentRequest {
  orderId: number
  amount: number
  description?: string
  bankCode?: string
}

export interface CreatePaymentResponse {
  qrContent: string
  accountNumber: string
  accountName: string
  bankCode: string
  transferContent: string
  referenceId: string
}

export interface PaymentStatusResponse {
  success: boolean
  orderId: number
  paymentMethod: string
  paymentStatus: 'PAID' | 'UNPAID'
  status: string
}

export interface TransactionMatchResponse {
  success: boolean
  message: string
  transaction?: any
}

export const PaymentService = {
  // Tạo payment intent cho đơn hàng
  async createPaymentIntent(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    const res = await fetch(`${API_BASE_URL}/payments/sepay/intent`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(request)
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Failed to create payment intent: ${res.status} - ${errorText}`)
    }

    const data = await res.json()
    return data
  },

  // Kiểm tra trạng thái thanh toán của đơn hàng
  async getPaymentStatus(orderId: number): Promise<PaymentStatusResponse> {
    const res = await fetch(`${API_BASE_URL}/payments/status/${orderId}`, {
      headers: authHeaders()
    })

    if (!res.ok) {
      throw new Error(`Failed to get payment status: ${res.status}`)
    }

    return res.json()
  },

  // Kiểm tra giao dịch chuyển khoản có khớp không
  async matchTransaction(content: string, amount: number, limit: number = 20): Promise<TransactionMatchResponse> {
    const params = new URLSearchParams({
      content,
      amount: amount.toString(),
      limit: limit.toString()
    })

    const res = await fetch(`${API_BASE_URL}/payments/sepay/match?${params.toString()}`, {
      headers: authHeaders()
    })

    if (!res.ok) {
      throw new Error(`Failed to match transaction: ${res.status}`)
    }

    return res.json()
  },

  // Lấy danh sách giao dịch mới nhất
  async getLatestTransactions(limit: number = 20, accountNumber?: string): Promise<any> {
    const params = new URLSearchParams({
      limit: limit.toString()
    })

    if (accountNumber) {
      params.set('accountNumber', accountNumber)
    }

    const res = await fetch(`${API_BASE_URL}/payments/sepay/transactions?${params.toString()}`, {
      headers: authHeaders()
    })

    if (!res.ok) {
      throw new Error(`Failed to get transactions: ${res.status}`)
    }

    return res.json()
  },

  // Cập nhật trạng thái thanh toán (gọi từ Order Service)
  async updatePaymentStatus(orderId: number, paymentStatus: 'PAID' | 'UNPAID'): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/payment-status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ paymentStatus })
    })

    if (!res.ok) {
      throw new Error(`Failed to update payment status: ${res.status}`)
    }

    return res.json()
  }
}
