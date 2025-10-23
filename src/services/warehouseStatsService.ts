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


export interface StockSummaryItem {
  productUnitId: number
  productId: number
  productName: string
  unitName: string
  unitPrice: number
  totalQuantity: number
  availableQuantity: number
  reservedQuantity: number
  totalValue: number
  availableValue: number
}

export interface LowStockAlertItem {
  productUnitId: number
  productId: number
  productName: string
  unitName: string
  unitPrice: number
  totalQuantity: number
  availableQuantity: number
  reservedQuantity: number
  totalValue: number
  availableValue: number
  threshold: number
}

class WarehouseStatsService {

  async getStockSummary(): Promise<StockSummaryItem[]> {
    const res = await fetch(`${API_BASE_URL}/inventory/stock/summary`, {
      method: 'GET',
      headers: authHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to fetch stock summary: ${res.status}`)
    const json = await res.json()
    const stockData = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : [])

    // API đã trả về đầy đủ thông tin, không cần gọi thêm API khác
    return stockData.map((item: any) => ({
      productUnitId: item.productUnitId,
      productId: item.productId,
      productName: item.productName,
      unitName: item.unitName,
      unitPrice: item.unitPrice,
      totalQuantity: item.totalQuantity,
      availableQuantity: item.availableQuantity,
      reservedQuantity: item.reservedQuantity,
      totalValue: item.totalValue,
      availableValue: item.availableValue,
    }))
  }

  async getLowStockAlerts(threshold: number = 5): Promise<LowStockAlertItem[]> {
    const params = new URLSearchParams({ threshold: String(threshold) })
    const res = await fetch(`${API_BASE_URL}/inventory/stock/alerts/low?${params.toString()}`, {
      method: 'GET',
      headers: authHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to fetch low stock alerts: ${res.status}`)
    const json = await res.json()
    const alertData = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : [])

    // API đã trả về đầy đủ thông tin, không cần gọi thêm API khác
    return alertData.map((item: any) => ({
      productUnitId: item.productUnitId,
      productId: item.productId,
      productName: item.productName,
      unitName: item.unitName,
      unitPrice: item.unitPrice,
      totalQuantity: item.totalQuantity,
      availableQuantity: item.availableQuantity,
      reservedQuantity: item.reservedQuantity,
      totalValue: item.totalValue,
      availableValue: item.availableValue,
      threshold: item.threshold,
    }))
  }
}

export const warehouseStatsService = new WarehouseStatsService()


