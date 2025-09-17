// Inventory Service - API calls for warehouses, stock, and transactions
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

function authHeaders(contentType: string = 'application/json'): HeadersInit {
  const token = localStorage.getItem('access_token')
  const headers: HeadersInit = { 'Authorization': token ? `Bearer ${token}` : '' }
  if (contentType) headers['Content-Type'] = contentType
  return headers
}

function getJwtUserId(): string | number | undefined {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return undefined
    const [, payloadB64] = token.split('.')
    if (!payloadB64) return undefined
    const json = decodeURIComponent(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')).split('').map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''))
    const payload = JSON.parse(json)
    return payload.userId ?? payload.userid ?? payload.id ?? payload.sub
  } catch {
    return undefined
  }
}

export interface WarehouseDto {
  id: number
  name: string
  address?: string
  phone?: string
  email?: string
  manager?: string
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export interface StockLocationDto {
  id: number
  name: string
  description?: string
  warehouseId: number
  active: boolean
}

export interface StockBalanceDto {
  id: number
  productUnitId: number
  warehouseId: number
  stockLocationId: number
  quantity: number
  reservedQuantity?: number
  availableQuantity?: number
  updatedAt?: string
  // Optional enrichment fields if BE returns
  productName?: string
  unitName?: string
  warehouseName?: string
}

export interface TransactionPayload {
  transactionType?: 'IMPORT' | 'EXPORT' | 'ADJUST' | 'TRANSFER'
  quantity: number
  transactionDate: string
  note?: string
  referenceNumber?: string
  productUnitId: number
  stockLocationId: number
  warehouseId: number
}

export interface TransactionDto {
  id: number
  productUnitId: number
  warehouseId: number
  stockLocationId: number
  quantity: number
  transactionType: 'IMPORT' | 'EXPORT' | 'ADJUST' | 'TRANSFER'
  transactionDate: string
  note?: string
  referenceNumber?: string
  createdAt?: string
  updatedAt?: string
  // Optional enrichment fields if BE returns
  productName?: string
  unitName?: string
  warehouseName?: string
}

// Inventory Check DTOs
export interface InventoryCheckDto {
  id: number
  stocktakingDate?: string
  checkDate?: string
  warehouseId: number
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  createdBy?: string
  createdAt?: string
  updatedAt?: string
  note?: string
  stockLocationId?: number
  totalItems?: number
  checkedItems?: number
  discrepancyItems?: number
  warehouseName?: string
}

export interface CheckItemDto {
  id: number
  checkId: number
  productUnitId: number
  systemQuantity: number
  actualQuantity: number
  difference: number
  note?: string
  status: 'PENDING' | 'CHECKED' | 'DISCREPANCY'
  createdAt?: string
  updatedAt?: string
  productName?: string
  unitName?: string
}

export const InventoryService = {
  // Warehouses
  async getWarehouses(): Promise<WarehouseDto[]> {
    console.log('🔍 Fetching warehouses from:', `${API_BASE_URL}/warehouses`)
    const res = await fetch(`${API_BASE_URL}/warehouses`, { headers: authHeaders() })
    console.log('📡 Warehouses response status:', res.status)
    if (!res.ok) throw new Error(`Failed to fetch warehouses: ${res.status}`)
    const data = await res.json()
    console.log('📦 Warehouses response data:', data)
    return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
  },

  async createWarehouse(payload: Partial<WarehouseDto>): Promise<WarehouseDto> {
    const res = await fetch(`${API_BASE_URL}/warehouses`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) })
    if (!res.ok) throw new Error('Failed to create warehouse')
    const data = await res.json()
    return data?.data ?? data
  },

  async updateWarehouse(id: number, payload: Partial<WarehouseDto>): Promise<WarehouseDto> {
    console.log('🔄 Updating warehouse:', id, payload)
    const res = await fetch(`${API_BASE_URL}/warehouses/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload) })
    console.log('📡 Update warehouse response:', res.status)
    if (!res.ok) throw new Error('Failed to update warehouse')
    const data = await res.json()
    console.log('📦 Update warehouse response data:', data)
    return data?.data ?? data
  },

  async deleteWarehouse(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/warehouses/${id}`, { method: 'DELETE', headers: authHeaders() })
    if (!res.ok) throw new Error('Failed to delete warehouse')
  },

  async toggleWarehouseStatus(id: number, active: boolean): Promise<WarehouseDto> {
    console.log('🔄 Toggling warehouse status:', id, active)
    const res = await fetch(`${API_BASE_URL}/warehouses/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ active })
    })
    console.log('📡 Toggle status response:', res.status)
    if (!res.ok) throw new Error('Failed to toggle warehouse status')
    const data = await res.json()
    console.log('📦 Toggle status response data:', data)
    return data?.data ?? data
  },

  // Stock locations
  async getStockLocations(warehouseId?: number): Promise<StockLocationDto[]> {
    const url = warehouseId ? `${API_BASE_URL}/stock-locations?warehouseId=${warehouseId}` : `${API_BASE_URL}/stock-locations`
    const res = await fetch(url, { headers: authHeaders() })
    if (!res.ok) throw new Error('Failed to fetch stock locations')
    const data = await res.json()
    return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
  },

  // Stock balance
  async getStock(params?: { productUnitId?: number; warehouseId?: number; stockLocationId?: number }): Promise<StockBalanceDto[]> {
    const search = new URLSearchParams()
    if (params?.productUnitId) search.set('productUnitId', String(params.productUnitId))
    if (params?.warehouseId) search.set('warehouseId', String(params.warehouseId))
    if (params?.stockLocationId) search.set('stockLocationId', String(params.stockLocationId))
    const qs = search.toString()
    const url = `${API_BASE_URL}/inventory/stock${qs ? `?${qs}` : ''}`
    console.log('🔍 Fetching stock from:', url)
    const res = await fetch(url, { headers: authHeaders() })
    console.log('📡 Stock response status:', res.status)
    if (!res.ok) throw new Error('Failed to fetch stock')
    const data = await res.json()
    console.log('📊 Stock response data:', data)
    return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
  },

  // Transactions quick actions
  async inboundProcess(payload: Omit<TransactionPayload, 'transactionType'>): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/inventory/inbound/process`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) })
    if (!res.ok) throw new Error('Failed to process inbound')
    return await res.json().catch(() => ({}))
  },

  async outbound(payload: Omit<TransactionPayload, 'transactionType'>): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/inventory/outbound`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) })
    if (!res.ok) throw new Error('Failed to create outbound')
    return await res.json().catch(() => ({}))
  },

  // Transactions
  async getTransactions(params?: {
    transactionType?: 'IMPORT' | 'EXPORT' | 'ADJUST' | 'TRANSFER'
    warehouseId?: number
    productUnitId?: number
    startDate?: string
    endDate?: string
  }): Promise<TransactionDto[]> {
    const search = new URLSearchParams()
    if (params?.transactionType) search.set('transactionType', params.transactionType)
    if (params?.warehouseId) search.set('warehouseId', String(params.warehouseId))
    if (params?.productUnitId) search.set('productUnitId', String(params.productUnitId))
    if (params?.startDate) search.set('startDate', params.startDate)
    if (params?.endDate) search.set('endDate', params.endDate)
    const qs = search.toString()
    const url = `${API_BASE_URL}/inventory/transactions${qs ? `?${qs}` : ''}`
    console.log('🔍 Fetching transactions from:', url)
    const res = await fetch(url, { headers: authHeaders() })
    console.log('📡 Transactions response status:', res.status)
    if (!res.ok) throw new Error('Failed to fetch transactions')
    const data = await res.json()
    console.log('📊 Transactions response data:', data)
    return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
  },

  async createTransaction(payload: Omit<TransactionPayload, 'transactionType'> & { transactionType: 'IMPORT' | 'EXPORT' }): Promise<TransactionDto> {
    console.log('🔄 Creating transaction:', payload)
    const res = await fetch(`${API_BASE_URL}/inventory/transactions`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    })
    console.log('📡 Create transaction response:', res.status)
    if (!res.ok) throw new Error('Failed to create transaction')
    const data = await res.json()
    console.log('📦 Create transaction response data:', data)
    return data?.data ?? data
  },

  async updateTransaction(id: number, payload: Partial<TransactionPayload>): Promise<TransactionDto> {
    console.log('🔄 Updating transaction:', id, payload)
    const res = await fetch(`${API_BASE_URL}/inventory/transactions/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    })
    console.log('📡 Update transaction response:', res.status)
    if (!res.ok) throw new Error('Failed to update transaction')
    const data = await res.json()
    console.log('📦 Update transaction response data:', data)
    return data?.data ?? data
  },

  async deleteTransaction(id: number): Promise<void> {
    console.log('🔄 Deleting transaction:', id)
    const res = await fetch(`${API_BASE_URL}/inventory/transactions/${id}`, { method: 'DELETE', headers: authHeaders() })
    console.log('📡 Delete transaction response:', res.status)
    if (!res.ok) throw new Error('Failed to delete transaction')
  },

  // Inventory Checks
  async getInventoryChecks(): Promise<InventoryCheckDto[]> {
    const url = `${API_BASE_URL}/inventory/stocktaking`
    console.log('🔍 Fetching inventory checks from:', url)
    const res = await fetch(url, { headers: authHeaders() })
    console.log('📡 Inventory checks response status:', res.status)
    if (!res.ok) throw new Error('Failed to fetch inventory checks')
    const data = await res.json().catch(() => [])
    return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
  },

  async createInventoryCheck(payload: {
    stocktakingDate: string
    warehouseId: number
    stockLocationId: number
    note?: string
  }): Promise<InventoryCheckDto> {
    console.log('🔄 Creating inventory check:', payload)
    const headers = authHeaders()
    const userId = getJwtUserId()
    if (userId) (headers as any)['X-User-Id'] = String(userId)
    const res = await fetch(`${API_BASE_URL}/inventory/stocktaking`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })
    console.log('📡 Create inventory check response:', res.status)
    if (!res.ok) throw new Error('Failed to create inventory check')
    const data = await res.json()
    return data?.data ?? data
  },

  async updateInventoryCheck(id: number, payload: Partial<InventoryCheckDto>): Promise<InventoryCheckDto> {
    console.log('🔄 Updating inventory check:', id, payload)
    const res = await fetch(`${API_BASE_URL}/inventory/checks/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    })
    console.log('📡 Update inventory check response:', res.status)
    if (!res.ok) throw new Error('Failed to update inventory check')
    const data = await res.json()
    console.log('📦 Update inventory check response data:', data)
    return data?.data ?? data
  },

  async deleteInventoryCheck(id: number): Promise<void> {
    console.log('🔄 Deleting inventory check:', id)
    const res = await fetch(`${API_BASE_URL}/inventory/stocktaking/${id}`, { method: 'DELETE', headers: authHeaders() })
    console.log('📡 Delete inventory check response:', res.status)
    if (!res.ok) throw new Error('Failed to delete inventory check')
  },

  // Check Items
  // This API confirms and persists items; FE composes the items array and submits
  async confirmInventoryCheck(checkId: number, items: Array<{ productUnitId: number; systemQuantity: number; actualQuantity: number; note?: string }>): Promise<any> {
    const url = `${API_BASE_URL}/inventory/stocktaking/${checkId}/confirm`
    console.log('🔄 Confirming stocktaking:', checkId, items)
    const res = await fetch(url, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(items) })
    console.log('📡 Confirm stocktaking response:', res.status)
    if (!res.ok) throw new Error('Failed to confirm stocktaking')
    return await res.json().catch(() => ({}))
  },

  // Get stocktaking details
  async getInventoryCheckDetails(checkId: number): Promise<{ id: number; items: Array<{ id?: number; productUnitId: number; productName?: string; unitName?: string; systemQuantity: number; actualQuantity: number; note?: string; status?: string }> }> {
    const url = `${API_BASE_URL}/inventory/stocktaking/${checkId}/details`
    console.log('🔍 Fetching stocktaking details from:', url)
    const res = await fetch(url, { headers: authHeaders() })
    if (!res.ok) throw new Error('Failed to fetch stocktaking details')
    const data = await res.json().catch(() => ({}))
    const payload = data?.data ?? data ?? {}
    const items = Array.isArray(payload?.items) ? payload.items : (Array.isArray(payload) ? payload : [])
    return { id: checkId, items }
  },

  // Export stocktaking excel from BE
  async exportStocktakingExcel(checkId: number): Promise<void> {
    const url = `${API_BASE_URL}/inventory/stocktaking/${checkId}/export.xlsx`
    console.log('📦 Downloading stocktaking excel:', url)
    const res = await fetch(url, { headers: authHeaders(''), method: 'GET' })
    if (!res.ok) throw new Error('Failed to export stocktaking excel')
    const blob = await res.blob()
    const link = document.createElement('a')
    const href = URL.createObjectURL(blob)
    link.href = href
    const date = new Date().toISOString().split('T')[0]
    link.download = `stocktaking_${checkId}_${date}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(href)
  },
}


