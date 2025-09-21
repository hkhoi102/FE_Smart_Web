const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token')
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  }
}

export type ReturnStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED'

export interface ReturnOrderDto {
  id: number
  orderId: number
  customerId: number
  status: ReturnStatus
  reason?: string
  refundAmount?: number
  createdAt?: string
  processedAt?: string
  returnDetails?: Array<{ id: number; orderDetailId: number; quantity: number; refundAmount: number }>
}

export const ReturnService = {
  async list(params: { page?: number; size?: number; customerId?: number; status?: ReturnStatus } = {}) {
    const sp = new URLSearchParams()
    if (params.page != null) sp.set('page', String(params.page))
    if (params.size != null) sp.set('size', String(params.size))
    if (params.customerId != null) sp.set('customerId', String(params.customerId))
    if (params.status) sp.set('status', params.status)
    const res = await fetch(`${API_BASE_URL}/returns?${sp.toString()}`, { headers: authHeaders() })
    if (!res.ok) throw new Error(`Failed to fetch returns: ${res.status}`)
    return res.json()
  },

  async getById(id: number): Promise<{ success: boolean; data: ReturnOrderDto }> {
    const res = await fetch(`${API_BASE_URL}/returns/${id}`, { headers: authHeaders() })
    if (!res.ok) throw new Error(`Failed to fetch return ${id}`)
    return res.json()
  },

  async create(body: { orderId: number; reason: string; returnDetails: Array<{ orderDetailId: number; quantity: number }> }) {
    const res = await fetch(`${API_BASE_URL}/returns`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) })
    if (!res.ok) throw new Error(`Failed to create return: ${res.status}`)
    return res.json()
  },

  async updateStatus(id: number, status: ReturnStatus) {
    const res = await fetch(`${API_BASE_URL}/returns/${id}/status`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status }) })
    if (!res.ok) throw new Error(`Failed to update return status: ${res.status}`)
    return res.json()
  },

  async approve(id: number) {
    const res = await fetch(`${API_BASE_URL}/returns/${id}/approve`, { method: 'PUT', headers: authHeaders() })
    if (!res.ok) throw new Error(`Failed to approve return: ${res.status}`)
    return res.json()
  },

  async reject(id: number) {
    const res = await fetch(`${API_BASE_URL}/returns/${id}/reject`, { method: 'PUT', headers: authHeaders() })
    if (!res.ok) throw new Error(`Failed to reject return: ${res.status}`)
    return res.json()
  },

  async complete(id: number) {
    const res = await fetch(`${API_BASE_URL}/returns/${id}/complete`, { method: 'PUT', headers: authHeaders() })
    if (!res.ok) throw new Error(`Failed to complete return: ${res.status}`)
    return res.json()
  },
}


