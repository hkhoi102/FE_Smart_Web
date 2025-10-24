const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

export type PromotionType = 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT' | 'BUY_X_GET_Y'
export type TargetType = 'PRODUCT' | 'CATEGORY' | 'CUSTOMER'

export const PromotionService = {
  async createHeader(payload: { name: string; startDate: string; endDate?: string; active?: boolean; type?: PromotionType }): Promise<{ id: number }> {
    const res = await fetch(`${API_BASE_URL}/promotions/headers`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error('Failed to create promotion header')
    const data = await res.json()
    return data.data ?? data
  },

  async createLine(payload: { promotionHeaderId: number; targetType: TargetType; targetId: number; startDate?: string; endDate?: string; active?: boolean; type?: PromotionType }): Promise<{ id: number }> {
    const res = await fetch(`${API_BASE_URL}/promotions/lines`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify({ ...payload, promotionType: payload.type, type: payload.type })
    })
    if (!res.ok) throw new Error('Failed to create promotion line')
    const data = await res.json()
    return data.data ?? data
  },

  async createDetail(payload: { promotionLineId: number; discountPercent?: number; discountAmount?: number; minAmount?: number; maxDiscount?: number; conditionQuantity?: number; freeQuantity?: number; active?: boolean }): Promise<{ id: number }> {
    const res = await fetch(`${API_BASE_URL}/promotions/details`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error('Failed to create promotion detail')
    const data = await res.json()
    return data.data ?? data
  },

  async createFullPromotion(input: {
    header: { name: string; startDate: string; endDate?: string; active?: boolean; type?: PromotionType }
    line: { targetType: TargetType; targetId: number; startDate?: string; endDate?: string; active?: boolean; type?: PromotionType }
    detail: { discountPercent?: number; discountAmount?: number; minAmount?: number; maxDiscount?: number; conditionQuantity?: number; freeQuantity?: number; active?: boolean }
  }): Promise<{ headerId: number; lineId: number; detailId: number }> {
    const header = await this.createHeader(input.header)
    const line = await this.createLine({ ...input.line, promotionHeaderId: header.id })
    const detail = await this.createDetail({ ...input.detail, promotionLineId: line.id })
    return { headerId: header.id, lineId: line.id, detailId: detail.id }
  }
}

// Extra APIs
const BASE = `${API_BASE_URL}/promotions`

export interface PromotionHeaderDto {
  id: number
  name: string
  type: 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT' | 'BUY_X_GET_Y'
  startDate?: string
  endDate?: string
  active: boolean
}

export interface PromotionLineDto {
  id: number
  promotionHeaderId: number
  targetType: 'PRODUCT' | 'CATEGORY' | 'CUSTOMER'
  targetId: number
  startDate?: string
  endDate?: string
  active: boolean
  type?: 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT' | 'BUY_X_GET_Y'
}

export interface PromotionDetailDto {
  id?: number
  promotionLineId: number
  discountPercent?: number
  discountAmount?: number
  minAmount?: number
  maxDiscount?: number
  conditionQuantity?: number
  freeQuantity?: number
  // New fields to support BUY_X_GET_Y detail payload
  giftProductUnitId?: number
  conditionProductUnitId?: number
  active: boolean
}

export const PromotionServiceApi = {
  async getHeaders(): Promise<PromotionHeaderDto[]> {
    const res = await fetch(`${BASE}/headers`, { headers: authHeaders() })
    if (!res.ok) throw new Error('Failed to fetch headers')
    const data = await res.json()
    return Array.isArray(data?.data) ? data.data : data
  },

  async getHeaderById(id: number): Promise<PromotionHeaderDto> {
    const res = await fetch(`${BASE}/headers/${id}`, { headers: authHeaders() })
    if (!res.ok) throw new Error('Failed to fetch header detail')
    const data = await res.json()
    return data?.data ?? data
  },

  async getLinesAll(headerId: number): Promise<PromotionLineDto[]> {
    const res = await fetch(`${BASE}/headers/${headerId}/lines/all`, { headers: authHeaders() })
    if (!res.ok) throw new Error('Failed to fetch lines')
    const data = await res.json()
    return Array.isArray(data?.data) ? data.data : data
  },

  async getDetailsAll(lineId: number): Promise<PromotionDetailDto[]> {
    const res = await fetch(`${BASE}/lines/${lineId}/details/all`, { headers: authHeaders() })
    if (!res.ok) throw new Error('Failed to fetch details')
    const data = await res.json()
    return Array.isArray(data?.data) ? data.data : data
  },

  async activateLine(id: number): Promise<void> {
    const res = await fetch(`${BASE}/lines/${id}/activate`, { method: 'PUT', headers: authHeaders() })
    if (!res.ok) throw new Error('Failed to activate line')
  },

  async deactivateLine(id: number): Promise<void> {
    const res = await fetch(`${BASE}/lines/${id}/deactivate`, { method: 'PUT', headers: authHeaders() })
    if (!res.ok) throw new Error('Failed to deactivate line')
  },

  async createDetail(body: PromotionDetailDto): Promise<PromotionDetailDto> {
    const res = await fetch(`${BASE}/details`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) })
    if (!res.ok) throw new Error('Failed to create detail')
    const data = await res.json()
    return data?.data ?? data
  },

  async updateDetail(id: number, body: Partial<PromotionDetailDto>): Promise<PromotionDetailDto> {
    const res = await fetch(`${BASE}/details/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) })
    if (!res.ok) throw new Error('Failed to update detail')
    const data = await res.json()
    return data?.data ?? data
  },

  async activateDetail(id: number): Promise<void> {
    const res = await fetch(`${BASE}/details/${id}/activate`, { method: 'PUT', headers: authHeaders() })
    if (!res.ok) throw new Error('Failed to activate detail')
  },

  async deactivateDetail(id: number): Promise<void> {
    const res = await fetch(`${BASE}/details/${id}/deactivate`, { method: 'PUT', headers: authHeaders() })
    if (!res.ok) throw new Error('Failed to deactivate detail')
  },

  async activateHeader(id: number): Promise<void> {
    const res = await fetch(`${BASE}/headers/${id}/activate`, { method: 'PUT', headers: authHeaders() })
    if (!res.ok) throw new Error('Failed to activate header')
  },

  async deactivateHeader(id: number): Promise<void> {
    const res = await fetch(`${BASE}/headers/${id}/deactivate`, { method: 'PUT', headers: authHeaders() })
    if (!res.ok) throw new Error('Failed to deactivate header')
  }
}

// Extra CRUD helpers for headers and lines
export const PromotionMutations = {
  async createHeader(body: { name: string; startDate: string; endDate: string; active: boolean; type?: PromotionHeaderDto['type'] }): Promise<PromotionHeaderDto> {
    const res = await fetch(`${BASE}/headers`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) })
    if (!res.ok) throw new Error('Failed to create header')
    const data = await res.json()
    return data?.data ?? data
  },

  async updateHeader(id: number, body: Partial<{ name: string; startDate: string; endDate: string; active: boolean; type?: PromotionHeaderDto['type'] }>): Promise<PromotionHeaderDto> {
    const res = await fetch(`${BASE}/headers/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) })
    if (!res.ok) throw new Error('Failed to update header')
    const data = await res.json()
    return data?.data ?? data
  },

  async deleteHeader(id: number): Promise<void> {
    const res = await fetch(`${BASE}/headers/${id}`, { method: 'DELETE', headers: authHeaders() })
    if (!res.ok) throw new Error('Failed to delete header')
  },

  async createLine(headerId: number, body: { targetType: PromotionLineDto['targetType']; targetId: number; startDate: string; endDate: string; active: boolean; type?: PromotionLineDto['type'] }): Promise<PromotionLineDto> {
    // Normalize payload for BE expectations
    const normalized = {
      ...body,
      startDate: body.startDate ? body.startDate + (body.startDate.includes('T') ? '' : 'T00:00:00') : undefined,
      endDate: body.endDate ? body.endDate + (body.endDate.includes('T') ? '' : 'T23:59:59') : undefined,
    }

    // Try flat endpoint first (most gateways expose this), include promotionHeaderId and promotionType
    const flatBody = { ...normalized, promotionHeaderId: headerId, promotionType: body.type }
    let res = await fetch(`${BASE}/lines`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(flatBody) })
    if (res.status === 404 || res.status === 405) {
      // Fallback to nested endpoint
      res = await fetch(`${BASE}/headers/${headerId}/lines`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(normalized) })
    }
    if (!res.ok) throw new Error('Failed to create line')
    const data = await res.json()
    return data?.data ?? data
  },

  async updateLine(lineId: number, body: Partial<{ targetType: PromotionLineDto['targetType']; targetId: number; startDate: string; endDate: string; active: boolean; type?: PromotionLineDto['type'] }>): Promise<PromotionLineDto> {
    const normalized = {
      ...body,
      startDate: body.startDate ? body.startDate + (body.startDate.includes('T') ? '' : 'T00:00:00') : undefined,
      endDate: body.endDate ? body.endDate + (body.endDate.includes('T') ? '' : 'T23:59:59') : undefined,
      promotionType: body.type,
      type: body.type,
    }
    const res = await fetch(`${BASE}/lines/${lineId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(normalized) })
    if (!res.ok) throw new Error('Failed to update line')
    const data = await res.json()
    return data?.data ?? data
  },

  async deleteLine(lineId: number): Promise<void> {
    const res = await fetch(`${BASE}/lines/${lineId}`, { method: 'DELETE', headers: authHeaders() })
    if (!res.ok) throw new Error('Failed to delete line')
  },
}


