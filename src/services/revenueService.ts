const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

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

export interface RevenueData {
  date: string
  revenue: number
}

export interface RevenueSummary {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
}

export interface RevenueSeriesResponse {
  success: boolean
  data: [string, number][]
  startDate: string
  endDate: string
  groupBy: 'day' | 'week' | 'month' | 'year'
}

export interface RevenueSummaryResponse {
  success: boolean
  data: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
  }
}

class RevenueService {
  // Lấy tổng doanh thu - tính từ dữ liệu series
  async getRevenueSummary(): Promise<RevenueSummary> {
    try {
      // Lấy dữ liệu 30 ngày gần nhất để tính tổng
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Lấy dữ liệu doanh thu
      const revenueQueryParams = new URLSearchParams({
        startDate,
        endDate,
        groupBy: 'day'
      })
      const revenueResponse = await fetch(`${API_BASE_URL}/orders/analytics/revenue/series?${revenueQueryParams}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      if (!revenueResponse.ok) {
        throw new Error(`HTTP error! status: ${revenueResponse.status}`)
      }

      const revenueData = await revenueResponse.json()
      const totalRevenue = revenueData.data.reduce((sum: number, [, revenue]: [string, number]) => sum + revenue, 0)

      // Lấy số đơn hàng thực tế từ API orders
      const ordersResponse = await fetch(`${API_BASE_URL}/orders?size=1000`, {
        method: 'GET',
        headers: authHeaders(),
      })

      if (!ordersResponse.ok) {
        throw new Error(`HTTP error! status: ${ordersResponse.status}`)
      }

      const ordersData = await ordersResponse.json()
      const totalOrders = ordersData.totalElements || ordersData.data?.length || 0
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      return {
        totalRevenue,
        totalOrders,
        averageOrderValue
      }
    } catch (error) {
      console.error('Error fetching revenue summary:', error)
      throw error
    }
  }

  // Lấy thống kê doanh thu theo ngày
  async getRevenueByDay(startDate: string, endDate: string): Promise<RevenueData[]> {
    try {
      const queryParams = new URLSearchParams({
        startDate,
        endDate,
        groupBy: 'day'
      })
      const response = await fetch(`${API_BASE_URL}/orders/analytics/revenue/series?${queryParams}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.data.map(([date, revenue]: [string, number]) => ({
        date,
        revenue
      }))
    } catch (error) {
      console.error('Error fetching revenue by day:', error)
      throw error
    }
  }

  // Lấy thống kê doanh thu theo tuần
  async getRevenueByWeek(startDate: string, endDate: string): Promise<RevenueData[]> {
    try {
      const queryParams = new URLSearchParams({
        startDate,
        endDate,
        groupBy: 'week'
      })
      const response = await fetch(`${API_BASE_URL}/orders/analytics/revenue/series?${queryParams}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.data.map(([date, revenue]: [string, number]) => ({
        date,
        revenue
      }))
    } catch (error) {
      console.error('Error fetching revenue by week:', error)
      throw error
    }
  }

  // Lấy thống kê doanh thu theo tháng
  async getRevenueByMonth(startDate: string, endDate: string): Promise<RevenueData[]> {
    try {
      const queryParams = new URLSearchParams({
        startDate,
        endDate,
        groupBy: 'month'
      })
      const response = await fetch(`${API_BASE_URL}/orders/analytics/revenue/series?${queryParams}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.data.map(([date, revenue]: [string, number]) => ({
        date,
        revenue
      }))
    } catch (error) {
      console.error('Error fetching revenue by month:', error)
      throw error
    }
  }

  // Lấy thống kê doanh thu theo năm
  async getRevenueByYear(startDate: string, endDate: string): Promise<RevenueData[]> {
    try {
      const queryParams = new URLSearchParams({
        startDate,
        endDate,
        groupBy: 'year'
      })
      const response = await fetch(`${API_BASE_URL}/orders/analytics/revenue/series?${queryParams}`, {
        method: 'GET',
        headers: authHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.data.map(([date, revenue]: [string, number]) => ({
        date,
        revenue
      }))
    } catch (error) {
      console.error('Error fetching revenue by year:', error)
      throw error
    }
  }
}

export const revenueService = new RevenueService()
